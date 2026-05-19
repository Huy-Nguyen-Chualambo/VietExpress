const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding drivers and vehicles...')

  // 1. Clean existing drivers and vehicles to ensure determinism
  await prisma.driver.deleteMany()
  await prisma.vehicle.deleteMany()

  // 2. Create Vehicles
  const vehicle1 = await prisma.vehicle.create({
    data: {
      vehicleType: 'motorbike',
      capacityKg: 50,
      status: 'available',
      region: 'Bắc',
      plateNumber: '29-A1 123.45',
    }
  })

  const vehicle2 = await prisma.vehicle.create({
    data: {
      vehicleType: 'van',
      capacityKg: 1000,
      status: 'available',
      region: 'Nam',
      plateNumber: '51-D2 999.88',
    }
  })

  const vehicle3 = await prisma.vehicle.create({
    data: {
      vehicleType: 'truck',
      capacityKg: 5000,
      status: 'available',
      region: 'Bắc',
      plateNumber: '29-C 555.22',
    }
  })

  const vehicle4 = await prisma.vehicle.create({
    data: {
      vehicleType: 'refrigerated_truck',
      capacityKg: 3500,
      status: 'available',
      region: 'Nam',
      plateNumber: '51-F 888.11',
    }
  })

  const vehicle5 = await prisma.vehicle.create({
    data: {
      vehicleType: 'heavy_truck',
      capacityKg: 15000,
      status: 'available',
      region: 'Trung',
      plateNumber: '43-H 777.66',
    }
  })

  console.log('Created 5 vehicles.')

  // 3. Create Drivers with license mapping and associate with vehicles
  await prisma.driver.create({
    data: {
      name: 'Nguyễn Văn Bắc',
      region: 'Bắc',
      status: 'available',
      workload: 0,
      licenses: ['motorbike', 'car'],
      vehicleId: vehicle1.id,
    }
  })

  await prisma.driver.create({
    data: {
      name: 'Trần Minh Nam',
      region: 'Nam',
      status: 'available',
      workload: 0,
      licenses: ['car', 'truck'],
      vehicleId: vehicle2.id,
    }
  })

  await prisma.driver.create({
    data: {
      name: 'Lê Hoàng Trung',
      region: 'Trung',
      status: 'available',
      workload: 0,
      licenses: ['motorbike', 'car'],
    }
  })

  await prisma.driver.create({
    data: {
      name: 'Phạm Anh Dũng',
      region: 'Bắc',
      status: 'available',
      workload: 0,
      licenses: ['truck', 'heavy_truck'],
      vehicleId: vehicle3.id,
    }
  })

  await prisma.driver.create({
    data: {
      name: 'Nguyễn Thanh Tùng',
      region: 'Nam',
      status: 'available',
      workload: 0,
      licenses: ['truck'],
      vehicleId: vehicle4.id,
    }
  })

  console.log('Created 5 drivers.')
  console.log('Drivers and vehicles seeded successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
