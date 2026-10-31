# ALLEX Furniture corporate-content source register

This register records the public sources reviewed while preparing the public website. It distinguishes research material from the live Supabase catalog and does not authorize database changes.

## Official public sources reviewed

- **ALLEX Furniture main website:** https://www.allexfurniturebd.com/
  - Used for the public brand tagline, furniture positioning, head-office address, and primary email.
  - The site also contains unrelated/demo-looking products and placeholder content. Those items are not treated as the authoritative product catalog.
- **ALLEX Furniture contact page:** https://www.allexfurniturebd.com/contact-us/
  - Secondary reference for the head-office contact details.
- **Allex Design official website:** https://www.allexdesign.com/
  - Describes interior and furniture solutions and identifies ALLEX Furniture as a manufacturing sister concern.
  - Broader project counts, warranty claims, and other service promises were not copied into ALLEX Furniture pages.
- **Allex Design About Us:** https://www.allexdesign.com/about-us/
  - Background only for group relationship and corporate context.
- **Allex Design page about ALLEX Furniture:** https://www.allexdesign.com/allex-furniture/
  - Describes office furniture, imported furniture, custom-made furniture, and modern office interiors.
  - Its factory address is recorded as a research item, not displayed as ALLEX Furniture's public head-office address without confirmation.
- **ALLEX Furniture LinkedIn company profile:** https://www.linkedin.com/company/allex-furniture/
  - Supplementary context only; historical experience claims are not used as verified website copy.

## Public company information currently used

| Field | Value used | Reason |
|---|---|---|
| Brand name | ALLEX Furniture | Official public website |
| Tagline | “We provide comfort, rather product.” | Official public website |
| Head office | NI Tower, Level 7, Plot 01, Road 10, Block E, Banani, Dhaka-1213, Bangladesh | Published on the official corporate websites |
| Furniture factory | Abdul Hamid Road, Daroga Bari More, Satarkul, Uttar Badda, Dhaka, Bangladesh | Explicitly labelled “Furniture Factory” on the Allex Design page about ALLEX Furniture; shown separately from the head office |
| Public email | info@allexfurniturebd.com | Published on the ALLEX Furniture website |
| Business positioning | Office/commercial furniture and custom-made furniture enquiries | Supported by official public websites |
| Public catalog | Existing Supabase product/category/image data | Database remains the source of truth for products |

## Group concerns

The company representative confirmed the following as separate concerns under the same group:

1. ALLEX Furniture
2. ALLEX Design & Development Ltd.
3. AD Steel & Construction
4. The Allex Design

The Allex Design website is linked for ALLEX Design & Development Ltd. No external URL or service description is invented for AD Steel & Construction or The Allex Design where an official source could not be confirmed.

## Conflicting or unconfirmed details intentionally not presented as ALLEX Furniture contact facts

- The ALLEX Furniture site displays a phone number in a format that appears placeholder-like, while Allex Design publishes a different phone number. The public site therefore does not display a phone number until the company confirms which number should be used for ALLEX Furniture.
- A second email address appears on the ALLEX Furniture website but is associated with another domain. It is not shown as the primary ALLEX Furniture email.
- The factory address is shown separately from the head office and should be reconfirmed as current before production release.
- No official public website was independently confirmed for AD Steel & Construction or The Allex Design during this review.

## Claims not copied into ALLEX Furniture pages without further confirmation

- Years in business or years of experience
- Number of completed projects
- Warranty periods
- Certifications, compliance claims, or material certifications
- Production capacity, employee count, or delivery commitments
- Product prices, stock availability, ratings, or specifications absent from the current catalog

## Database and implementation safeguards

The existing public database contains `categories`, `category_images`, `products`, `product_images`, `projects`, `project_images`, and `contacts`. The categories table comment documents a maximum three-level hierarchy, while the public route helpers remain defensive and data-driven. Product records do not contain pricing, inventory, cart, or order data.

No schema migration, table/column modification, or product/category data change is part of this website implementation. The live Supabase catalog remains the source of truth for active products and categories.

## Confirm before production publication

- Confirm the preferred ALLEX Furniture phone number.
- Confirm that the published furniture-factory address remains current before production release.
- Confirm official websites/social profiles for the two concerns without verified URLs.
- Review Privacy Policy and Terms against the deployed services and applicable law.
- Ensure `NEXT_PUBLIC_SITE_URL` is set to the intended production domain before release.
