import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const venues = [
  {
    name: 'The Warehouse Loft',
    description:
      'A stunning converted warehouse in the heart of Shoreditch. Original brick walls, exposed steel beams, and 18-foot ceilings create an unforgettable industrial backdrop for any event.',
    location: 'Shoreditch, London',
    capacity: 250,
    styles: ['industrial', 'warehouse', 'urban', 'corporate'],
    pricing: { currency: 'GBP', pricePerDay: 3500, pricePerHour: 450, minimumHours: 4 },
    photos: [],
  },
  {
    name: 'Rooftop at The Monument',
    description:
      'Breathtaking panoramic views of the City of London from our exclusive rooftop terrace. The perfect setting for summer soirées and cocktail receptions.',
    location: 'City of London',
    capacity: 120,
    styles: ['rooftop', 'outdoor', 'cocktail', 'corporate'],
    pricing: { currency: 'GBP', pricePerDay: 4200, pricePerHour: 600, minimumHours: 3 },
    photos: [],
  },
  {
    name: 'The Georgian Townhouse',
    description:
      'An exquisitely preserved Georgian townhouse across five floors, featuring ornate period fireplaces, parquet floors, and a walled garden. Ideal for intimate gatherings and private dinners.',
    location: 'Mayfair, London',
    capacity: 80,
    styles: ['heritage', 'elegant', 'intimate', 'private dining'],
    pricing: { currency: 'GBP', pricePerDay: 5500, pricePerHour: 750, minimumHours: 4 },
    photos: [],
  },
  {
    name: 'Riverside Gallery',
    description:
      'A light-filled contemporary art gallery on the South Bank with floor-to-ceiling windows overlooking the Thames. The rotating art collection provides a unique backdrop for every event.',
    location: 'South Bank, London',
    capacity: 180,
    styles: ['art gallery', 'contemporary', 'riverside', 'cultural'],
    pricing: { currency: 'GBP', pricePerDay: 4800, pricePerHour: 650, minimumHours: 4 },
    photos: [],
  },
  {
    name: 'The Cellar Club',
    description:
      'A beautifully restored Victorian cellar beneath a Soho townhouse. Arched brick ceilings, ambient candlelight, and a private bar create an intimate and atmospheric experience.',
    location: 'Soho, London',
    capacity: 60,
    styles: ['intimate', 'underground', 'vintage', 'cocktail'],
    pricing: { currency: 'GBP', pricePerDay: 2200, pricePerHour: 320, minimumHours: 3 },
    photos: [],
  },
  {
    name: 'The Grand Ballroom',
    description:
      'A magnificent Victorian ballroom with original crystal chandeliers, gilded ceilings, and a sprung dance floor. Accommodates up to 500 guests for seated dinners and galas.',
    location: 'Kensington, London',
    capacity: 500,
    styles: ['ballroom', 'grand', 'gala', 'wedding', 'formal'],
    pricing: { currency: 'GBP', pricePerDay: 12000, pricePerHour: 1500, minimumHours: 6 },
    photos: [],
  },
  {
    name: 'The Glass Pavilion',
    description:
      'A modernist glass pavilion set within 4 acres of manicured gardens in Richmond. The seamless indoor-outdoor flow and natural light make it perfect for daytime events.',
    location: 'Richmond, London',
    capacity: 160,
    styles: ['modern', 'garden', 'outdoor', 'daytime', 'wedding'],
    pricing: { currency: 'GBP', pricePerDay: 6500, pricePerHour: 850, minimumHours: 4 },
    photos: [],
  },
  {
    name: 'Hackney Wick Studios',
    description:
      "A raw and versatile creative space in East London's arts district. High ceilings, polished concrete floors, and a completely blank-canvas layout for productions and brand activations.",
    location: 'Hackney Wick, London',
    capacity: 300,
    styles: ['creative', 'industrial', 'blank canvas', 'production', 'urban'],
    pricing: { currency: 'GBP', pricePerDay: 2800, pricePerHour: 380, minimumHours: 4 },
    photos: [],
  },
  {
    name: "The Library at St James's",
    description:
      "A distinguished private members' club library with floor-to-ceiling mahogany shelving, leather Chesterfields, and a working fireplace. Exclusive access for private hire.",
    location: "St James's, London",
    capacity: 40,
    styles: ['library', 'heritage', 'intimate', 'private dining', 'formal'],
    pricing: { currency: 'GBP', pricePerDay: 3800, pricePerHour: 520, minimumHours: 3 },
    photos: [],
  },
  {
    name: 'The Rooftop Garden',
    description:
      'A lush rooftop garden in Notting Hill with over 200 plant species, a retractable glass canopy, and views across West London. A truly unique botanical setting.',
    location: 'Notting Hill, London',
    capacity: 90,
    styles: ['garden', 'rooftop', 'outdoor', 'botanical', 'intimate'],
    pricing: { currency: 'GBP', pricePerDay: 3200, pricePerHour: 440, minimumHours: 3 },
    photos: [],
  },
  {
    name: 'The Old Printworks',
    description:
      'A striking 19th-century printworks building in Bermondsey, featuring the original printing presses as decorative features. Raw, authentic, and endlessly photographable.',
    location: 'Bermondsey, London',
    capacity: 200,
    styles: ['industrial', 'heritage', 'warehouse', 'creative', 'corporate'],
    pricing: { currency: 'GBP', pricePerDay: 3000, pricePerHour: 400, minimumHours: 4 },
    photos: [],
  },
  {
    name: 'Chelsea Harbour Penthouse',
    description:
      'A stunning penthouse apartment in Chelsea Harbour with wraparound terraces, marina views, and bespoke interiors by a leading London designer. The ultimate luxury private hire.',
    location: 'Chelsea, London',
    capacity: 50,
    styles: ['luxury', 'penthouse', 'marina', 'intimate', 'private dining'],
    pricing: { currency: 'GBP', pricePerDay: 7500, pricePerHour: 1000, minimumHours: 4 },
    photos: [],
  },
];

async function main() {
  console.log('Seeding database...');
  await prisma.venue.deleteMany();
  for (const data of venues) {
    await prisma.venue.create({ data });
  }
  console.log(`Seeded ${venues.length} venues.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
