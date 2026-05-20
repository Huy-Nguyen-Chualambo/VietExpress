const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding drivers and vehicles...')

  // 1. Clean existing drivers and vehicles to ensure determinism
  await prisma.driver.deleteMany()
  await prisma.vehicle.deleteMany()

  const regions = [
    {
      name: 'Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội',
      platePrefix: '29',
    },
    {
      name: 'Phường Mỹ Phước, Thị xã Bến Cát, Bình Dương',
      platePrefix: '61',
    },
    {
      name: 'Phường Tân Định, Quận 1, Hồ Chí Minh',
      platePrefix: '51',
    },
  ]

  const vehicleTypes = [
    'heavy_truck',
    'truck',
    'refrigerated_truck',
    'motorbike',
    'van',
  ]

  const capacityByType = {
    heavy_truck: 15000,
    truck: 5000,
    refrigerated_truck: 3500,
    motorbike: 50,
    van: 1000,
  }

  const vehiclesByRegion = new Map()
  let plateCounter = 1

  // 2. Create Vehicles (each region has at least 5 types)
  for (const region of regions) {
    const vehicles = []
    for (const vehicleType of vehicleTypes) {
      const plateNumber = `${region.platePrefix}-${String(plateCounter).padStart(2, '0')} ${String(100 + plateCounter).padStart(3, '0')}.${String(plateCounter % 100).padStart(2, '0')}`
      plateCounter += 1

      const vehicle = await prisma.vehicle.create({
        data: {
          vehicleType,
          capacityKg: capacityByType[vehicleType],
          status: 'available',
          region: region.name,
          plateNumber,
        },
      })

      vehicles.push(vehicle)
    }
    vehiclesByRegion.set(region.name, vehicles)
  }

  console.log(`Created ${regions.length * vehicleTypes.length} vehicles.`)

  // 3. Create Drivers (each region has at least 5 drivers with matching licenses)
  const driverNameSeeds = [
    'Nguyễn Văn',
    'Trần Minh',
    'Lê Hoàng',
    'Phạm Anh',
    'Nguyễn Thanh',
  ]

  const driverSuffixByRegion = {
    'Phường Xuân Phương, Quận Nam Từ Liêm, Hà Nội': ['Bắc', 'Hà', 'Thắng', 'Nam', 'An'],
    'Phường Mỹ Phước, Thị xã Bến Cát, Bình Dương': ['Bình', 'Dương', 'Phước', 'Lộc', 'Hậu'],
    'Phường Tân Định, Quận 1, Hồ Chí Minh': ['Sơn', 'Hải', 'Lâm', 'Khang', 'Tùng'],
  }

  for (const region of regions) {
    const vehicles = vehiclesByRegion.get(region.name) || []
    const suffixes = driverSuffixByRegion[region.name]

    for (let i = 0; i < vehicleTypes.length; i++) {
      const vehicleType = vehicleTypes[i]
      const driverName = `${driverNameSeeds[i]} ${suffixes[i]}`
      const vehicle = vehicles.find((item) => item.vehicleType === vehicleType) || null

      await prisma.driver.create({
        data: {
          name: driverName,
          region: region.name,
          status: 'available',
          workload: 0,
          licenses: [vehicleType],
          vehicleId: vehicle ? vehicle.id : null,
        },
      })
    }
  }

  console.log(`Created ${regions.length * vehicleTypes.length} drivers.`)
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
