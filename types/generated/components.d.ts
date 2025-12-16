import type { Schema, Struct } from '@strapi/strapi';

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface SpkSectionDetail extends Struct.ComponentSchema {
  collectionName: 'components_spk_section_details';
  info: {
    description: 'SPK BPKB/STNK and customer detail information';
    displayName: 'SPK Detail';
    icon: 'address-card';
  };
  attributes: {
    alamatStnk: Schema.Attribute.Text;
    emailCustomer: Schema.Attribute.Email;
    kotaStnkBpkb: Schema.Attribute.String;
    namaBpkbStnk: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface SpkSectionPayment extends Struct.ComponentSchema {
  collectionName: 'components_spk_section_payments';
  info: {
    description: 'SPK payment and leasing information';
    displayName: 'SPK Payment';
    icon: 'credit-card';
  };
  attributes: {
    angsuran: Schema.Attribute.String;
    buktiBayar: Schema.Attribute.Media<'images' | 'files', true>;
    caraBayar: Schema.Attribute.Enumeration<['TUNAI', 'KREDIT']> &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'TUNAI'>;
    dp: Schema.Attribute.Decimal;
    keterangan: Schema.Attribute.Text;
    namaLeasing: Schema.Attribute.String;
    pembelianVia: Schema.Attribute.String;
    tandaJadi: Schema.Attribute.Decimal;
    tenor: Schema.Attribute.String;
  };
}

export interface SpkSectionUnit extends Struct.ComponentSchema {
  collectionName: 'components_spk_section_units';
  info: {
    description: 'SPK vehicle unit information';
    displayName: 'SPK Unit';
    icon: 'car';
  };
  attributes: {
    bonus: Schema.Attribute.Text;
    hargaOtr: Schema.Attribute.Decimal;
    lainLain: Schema.Attribute.Text;
    noMesin: Schema.Attribute.String;
    noRangka: Schema.Attribute.String;
    tahun: Schema.Attribute.String;
    vehicleType: Schema.Attribute.Relation<
      'oneToOne',
      'api::vehicle-type.vehicle-type'
    >;
    warna: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'spk_section.detail': SpkSectionDetail;
      'spk_section.payment': SpkSectionPayment;
      'spk_section.unit': SpkSectionUnit;
    }
  }
}
