const { createClient } = require('@strapi/strapi/dist/utils/postgres');

async function checkRelation() {
  const client = createClient({
    connectionString: 'postgres://postgres:yrkY!SKe5m2@kAkH5T9!@localhost:5433/karuniamotor',
  });

  try {
    await client.connect();

    // Check supervisors table
    const supervisorTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'supervisors'
      );
    `);
    console.log('Supervisors table exists:', supervisorTable.rows[0].exists);

    // Check user table for supervisor_id column
    const supervisorColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'up_users'
        AND column_name = 'supervisor_id'
      );
    `);
    console.log('Users table has supervisor_id column:', supervisorColumn.rows[0].exists);

    // Check if supervisor_id is unique in users table
    if (supervisorColumn.rows[0].exists) {
      const uniqueConstraint = await client.query(`
        SELECT con.conname, con.contype
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'up_users'
        AND con.consrc LIKE '%supervisor_id%';
      `);
      console.log('Supervisor_id constraints:', uniqueConstraint.rows);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkRelation();