const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding VetBridge database...');

  // Seed an admin user
  const admin = await prisma.user.upsert({
    where:  { phone: '+251900000000' },
    update: {},
    create: { phone: '+251900000000', name: 'VetBridge Admin', role: 'ADMIN' },
  });

  // Seed a sample owner
  const owner = await prisma.user.upsert({
    where:  { phone: '+251911234567' },
    update: {},
    create: { phone: '+251911234567', name: 'Sara Retta', role: 'OWNER' },
  });

  // Seed a sample pet
  await prisma.pet.upsert({
    where:  { microchipId: 'ETH-2024-48821' },
    update: {},
    create: { ownerId: owner.id, name: 'Milo', species: 'dog', breed: 'Labrador',
              weightKg: 28, sex: 'male', microchipId: 'ETH-2024-48821' },
  });

  // Seed a sample vet
  const vetUser = await prisma.user.upsert({
    where:  { phone: '+251912345678' },
    update: {},
    create: { phone: '+251912345678', name: 'Dr. Dawit Kebede', role: 'VET' },
  });

  await prisma.vetProfile.upsert({
    where:  { licenseNo: 'ETH-VET-2891' },
    update: {},
    create: {
      userId: vetUser.id, licenseNo: 'ETH-VET-2891',
      specializations: ['Small animals', 'Internal medicine', 'Vaccination'],
      workModes: ['home', 'clinic', 'emergency'],
      serviceRadiusKm: 5, primaryArea: 'Bole Sub-City',
      isVerified: true, isOnline: true, yearsExperience: 8,
    },
  });

  console.log('✅ Seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
