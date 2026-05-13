#!/usr/bin/env node

/**
 * Script to test SLA Monitoring API endpoints
 * Usage: node test-sla-api.js
 */

const BASE_URL = 'https://viet-express.vercel.app/api/sla-monitoring'
const AUTH_TOKEN = '122011qweqwe.A'
  || process.env.SLA_MONITORING_API_KEY || process.env.NEXTAUTH_TOKEN || ''

if (!AUTH_TOKEN) {
  console.error('Missing auth token. Set SLA_MONITORING_API_KEY (preferred) or NEXTAUTH_TOKEN.')
  process.exit(1)
}

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${AUTH_TOKEN}`,
}

async function testAtRiskOrders() {
  console.log('\n📋 Testing: Fetch At-Risk Orders')
  console.log('GET /api/sla-monitoring/at-risk-orders')

  try {
    const response = await fetch(`${BASE_URL}/at-risk-orders`, {
      method: 'GET',
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error(`❌ HTTP ${response.status}:`, JSON.stringify(data, null, 2))
      return null
    }

    console.log('✅ Response:', JSON.stringify(data, null, 2))
    return data.orders?.[0]?.id
  } catch (error) {
    console.error('❌ Error:', error.message)
    return null
  }
}

async function testCheckIntervention(orderId) {
  console.log('\n🔍 Testing: Check Recent Intervention')
  console.log('POST /api/sla-monitoring/check-intervention')

  try {
    const response = await fetch(`${BASE_URL}/check-intervention`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        minutesThreshold: 30,
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testReroute(orderId) {
  console.log('\n🔄 Testing: Execute Reroute')
  console.log('POST /api/sla-monitoring/reroute')

  try {
    const response = await fetch(`${BASE_URL}/reroute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        reason: 'SLA Risk - Reroute to ensure timely delivery',
        aiConfidence: 0.85,
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testProactiveContact(orderId) {
  console.log('\n📞 Testing: Proactive Contact')
  console.log('POST /api/sla-monitoring/proactive-contact')

  try {
    const response = await fetch(`${BASE_URL}/proactive-contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        strategy: 'CALL_CUSTOMER',
        message: 'Your shipment may experience a slight delay. We are working to ensure timely delivery.',
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testMarkUnrecoverable(orderId) {
  console.log('\n⚠️  Testing: Mark Unrecoverable')
  console.log('POST /api/sla-monitoring/mark-unrecoverable')

  try {
    const response = await fetch(`${BASE_URL}/mark-unrecoverable`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        compensation: 500000,
        reason: 'SLA cannot be met - Prepare compensation and escalate',
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testLogIntervention(orderId) {
  console.log('\n📝 Testing: Log Intervention')
  console.log('POST /api/sla-monitoring/log-intervention')

  try {
    const response = await fetch(`${BASE_URL}/log-intervention`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        intervention: 'REROUTE',
        aiConfidence: 0.85,
        metadata: {
          estimatedDelivery: new Date().toISOString(),
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timeToDeadline: 24,
          aiReasoning: 'Reroute is the best option with 85% success rate',
        },
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function testScheduleCallback(orderId) {
  console.log('\n⏰ Testing: Schedule Callback')
  console.log('POST /api/sla-monitoring/schedule-callback')

  try {
    const response = await fetch(`${BASE_URL}/schedule-callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orderId,
        callbackIn: 60,
        intervention: 'REROUTE',
      }),
    })

    const data = await response.json()
    console.log('✅ Response:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

async function runAllTests() {
  console.log('🧪 SLA Monitoring API Test Suite\n')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Auth Token: ${AUTH_TOKEN.slice(0, 20)}...`)

  // Test 1: Get at-risk orders
  const orderId = await testAtRiskOrders()

  if (!orderId) {
    console.log('\n⚠️  No at-risk orders found. Cannot test other endpoints.')
    console.log('Please ensure there are orders in the database with SLA risk.')
    process.exit(0)
  }

  // Test 2: Check intervention
  await testCheckIntervention(orderId)

  // Test 3: Reroute (skip if recent intervention)
  await testReroute(orderId)

  // Test 4: Proactive contact
  await testProactiveContact(orderId)

  // Test 5: Mark unrecoverable
  await testMarkUnrecoverable(orderId)

  // Test 6: Log intervention
  await testLogIntervention(orderId)

  // Test 7: Schedule callback
  await testScheduleCallback(orderId)

  console.log('\n✅ All tests completed!\n')
}

// Run tests
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

module.exports = {
  testAtRiskOrders,
  testCheckIntervention,
  testReroute,
  testProactiveContact,
  testMarkUnrecoverable,
  testLogIntervention,
  testScheduleCallback,
}
