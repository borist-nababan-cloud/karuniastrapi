'use strict';

const fs = require('fs-extra');
const path = require('path');
const mime = require('mime-types');

// Import seed data
const seedDataPath = path.join(__dirname, '../data/data.json');
if (!fs.existsSync(seedDataPath)) {
  console.error('Seed data file not found:', seedDataPath);
  process.exit(1);
}

const { categories, authors, articles, global, about } = require(seedDataPath);

// Track created entities for proper relationships
const createdEntities = {
  categories: new Map(),
  authors: new Map(),
  articles: new Map(),
  files: new Map()
};

async function seedExampleApp() {
  const shouldImportSeedData = await isFirstRun();

  if (shouldImportSeedData) {
    try {
      console.log('Setting up the template...');
      await importSeedData();
      console.log('Ready to go');
    } catch (error) {
      console.log('Could not import seed data');
      console.error(error);
    }
  } else {
    console.log(
      'Seed data has already been imported. We cannot reimport unless you clear your database first.'
    );
  }
}

async function isFirstRun() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });
  const initHasRun = await pluginStore.get({ key: 'initHasRun' });
  await pluginStore.set({ key: 'initHasRun', value: true });
  return !initHasRun;
}

async function setPublicPermissions(newPermissions) {
  // Find the ID of the public role
  const publicRole = await strapi.query('plugin::users-permissions.role').findOne({
    where: {
      type: 'public',
    },
  });

  if (!publicRole) {
    console.log('No public role found, skipping permissions setup');
    return;
  }

  // Create the new permissions and link them to the public role
  const allPermissionsToCreate = [];
  Object.keys(newPermissions).map((controller) => {
    const actions = newPermissions[controller];
    const permissionsToCreate = actions.map((action) => {
      return strapi.query('plugin::users-permissions.permission').create({
        data: {
          action: `api::${controller}.${controller}.${action}`,
          role: publicRole.id,
        },
      });
    });
    allPermissionsToCreate.push(...permissionsToCreate);
  });
  await Promise.all(allPermissionsToCreate);
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  const fileSizeInBytes = stats['size'];
  return fileSizeInBytes;
}

function getFileData(fileName) {
  const filePath = path.join('data', 'uploads', fileName);
  // Parse the file metadata
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split('.').pop();
  const mimeType = mime.lookup(ext || '') || '';

  return {
    path: filePath,
    name: fileName,
    size,
    type: mimeType,
  };
}

async function uploadFile(file, name) {
  try {
    const uploadedFile = await strapi
      .plugin('upload')
      .service('upload')
      .upload({
        files: file,
        data: {
          fileInfo: {
            alternativeText: `An image uploaded to Strapi called ${name}`,
            caption: name,
            name,
          },
        },
      });

    // Store file reference for later use
    if (uploadedFile && uploadedFile.length > 0) {
      createdEntities.files.set(name, uploadedFile[0]);
    }

    return uploadedFile;
  } catch (error) {
    console.error(`Error uploading file ${name}:`, error);
    return null;
  }
}

// Create an entry and attach files if there are any
async function createEntry({ model, entry, files = [] }) {
  try {
    // Process files if any
    let processedEntry = { ...entry };

    if (files.length > 0) {
      for (const fileField of files) {
        if (processedEntry[fileField.name] && typeof processedEntry[fileField.name] === 'string') {
          // It's a filename, try to get the uploaded file
          const uploadedFile = createdEntities.files.get(processedEntry[fileField.name]);
          if (uploadedFile) {
            processedEntry[fileField.name] = uploadedFile;
          }
        }
      }
    }

    // Actually create the entry in Strapi
    const result = await strapi.documents(`api::${model}.${model}`).create({
      data: processedEntry,
    });

    // Store the created entity for reference
    if (model === 'categories') {
      createdEntities.categories.set(entry.slug, result);
    } else if (model === 'authors') {
      createdEntities.authors.set(entry.email, result);
    } else if (model === 'articles') {
      createdEntities.articles.set(entry.slug, result);
    }

    return result;
  } catch (error) {
    console.error({ model, entry, error });
    throw error;
  }
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];
  const filesCopy = [...files];

  for (const fileName of filesCopy) {
    // Check if we already have this file in our cache
    if (createdEntities.files.has(fileName)) {
      existingFiles.push(createdEntities.files.get(fileName));
      continue;
    }

    // Check if the file already exists in Strapi
    try {
      const fileWhereName = await strapi.query('plugin::upload.file').findOne({
        where: {
          name: fileName.replace(/\..*$/, ''),
        },
      });

      if (fileWhereName) {
        // File exists, cache it and don't upload it
        createdEntities.files.set(fileName, fileWhereName);
        existingFiles.push(fileWhereName);
      } else {
        // File doesn't exist, upload it
        const fileData = getFileData(fileName);
        const fileNameNoExtension = fileName.split('.').shift();
        const [file] = await uploadFile(fileData, fileNameNoExtension);
        if (file) {
          uploadedFiles.push(file);
        }
      }
    } catch (error) {
      console.error(`Error checking file ${fileName}:`, error);
    }
  }

  const allFiles = [...existingFiles, ...uploadedFiles];
  // If only one file then return only that file
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function updateBlocks(blocks) {
  const updatedBlocks = [];
  for (const block of blocks) {
    if (block.__component === 'shared.media') {
      const uploadedFiles = await checkFileExistsBeforeUpload([block.file]);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file name on the block with the actual file
      blockCopy.file = uploadedFiles;
      updatedBlocks.push(blockCopy);
    } else if (block.__component === 'shared.slider') {
      // Get files already uploaded to Strapi or upload new files
      const existingAndUploadedFiles = await checkFileExistsBeforeUpload(block.files);
      // Copy the block to not mutate directly
      const blockCopy = { ...block };
      // Replace the file names on the block with the actual files
      blockCopy.files = existingAndUploadedFiles;
      // Push the updated block
      updatedBlocks.push(blockCopy);
    } else {
      // Just push the block as is
      updatedBlocks.push(block);
    }
  }

  return updatedBlocks;
}

async function importCategories() {
  console.log('Importing categories...');
  for (const category of categories) {
    try {
      await createEntry({
        model: 'category',
        entry: {
          ...category,
          // Make sure it's not a draft
          publishedAt: Date.now(),
        },
      });
      console.log(`  ✓ Created category: ${category.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create category ${category.name}:`, error);
    }
  }
}

async function importAuthors() {
  console.log('Importing authors...');
  for (const author of authors) {
    try {
      const avatarFile = await checkFileExistsBeforeUpload([author.avatar]);
      await createEntry({
        model: 'author',
        entry: {
          ...author,
          avatar: avatarFile,
          // Make sure it's not a draft
          publishedAt: Date.now(),
        },
      });
      console.log(`  ✓ Created author: ${author.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create author ${author.name}:`, error);
    }
  }
}

async function importArticles() {
  console.log('Importing articles...');
  for (const article of articles) {
    try {
      // Find and link the actual category and author IDs
      const categorySlug = article.category?.slug || (typeof article.category === 'string' ? article.category : null);
      const authorEmail = article.author?.email || (typeof article.author === 'string' ? article.author : null);

      let categoryId = null;
      let authorId = null;

      if (categorySlug && createdEntities.categories.has(categorySlug)) {
        categoryId = createdEntities.categories.get(categorySlug).id;
      }

      if (authorEmail && createdEntities.authors.has(authorEmail)) {
        authorId = createdEntities.authors.get(authorEmail).id;
      }

      const cover = article.cover ? await checkFileExistsBeforeUpload([`${article.slug}.jpg`]) : null;
      const updatedBlocks = await updateBlocks(article.blocks || []);

      await createEntry({
        model: 'article',
        entry: {
          ...article,
          category: categoryId ? { id: categoryId } : null,
          author: authorId ? { id: authorId } : null,
          cover,
          blocks: updatedBlocks,
          // Make sure it's not a draft
          publishedAt: Date.now(),
        },
      });
      console.log(`  ✓ Created article: ${article.title}`);
    } catch (error) {
      console.error(`  ✗ Failed to create article ${article.title}:`, error);
    }
  }
}

async function importGlobal() {
  console.log('Importing global settings...');
  try {
    const favicon = await checkFileExistsBeforeUpload(['favicon.png']);
    const shareImage = await checkFileExistsBeforeUpload(['default-image.png']);

    await createEntry({
      model: 'global',
      entry: {
        ...global,
        favicon,
        publishedAt: Date.now(),
        defaultSeo: {
          ...global.defaultSeo,
          shareImage,
        },
      },
    });
    console.log('  ✓ Created global settings');
  } catch (error) {
    console.error('  ✗ Failed to create global settings:', error);
  }
}

async function importAbout() {
  console.log('Importing about page...');
  try {
    const updatedBlocks = await updateBlocks(about.blocks || []);
    await createEntry({
      model: 'about',
      entry: {
        ...about,
        blocks: updatedBlocks,
        publishedAt: Date.now(),
      },
    });
    console.log('  ✓ Created about page');
  } catch (error) {
    console.error('  ✗ Failed to create about page:', error);
  }
}

async function importSeedData() {
  // Set public permissions
  await setPublicPermissions({
    article: ['find', 'findOne'],
    category: ['find', 'findOne'],
    author: ['find', 'findOne'],
    global: ['find', 'findOne'],
    about: ['find', 'findOne'],
  });

  // Import in the correct order (respecting dependencies)
  await importCategories();
  await importAuthors();
  await importArticles();
  await importGlobal();
  await importAbout();
}

// Export for use in other scripts
module.exports = {
  seedExampleApp,
  importSeedData,
  cleanSeedData
};

// Run if called directly
if (require.main === module) {
  seedExampleApp();
}