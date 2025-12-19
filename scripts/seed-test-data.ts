import { createClient } from "@supabase/supabase-js"

// This script seeds test data for the admin dashboard
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function seedTestData() {
  console.log("Starting to seed test data...")

  try {
    // 1. Create test user profile if not exists
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", "testuser@example.com")
      .single()

    let testUserId = existingProfile?.id

    if (!testUserId) {
      const { data: newProfile, error: profileError } = await supabase
        .from("profiles")
        .insert({
          email: "testuser@example.com",
          full_name: "Test User",
          role: "user",
          is_active: true,
          balance: 100000,
        })
        .select("id")
        .single()

      if (profileError) {
        console.error("Error creating test profile:", profileError)
        return
      }
      testUserId = newProfile.id
      console.log("Created test user:", testUserId)
    } else {
      console.log("Test user already exists:", testUserId)
    }

    // 2. Get or create test service and country
    const { data: service } = await supabase.from("services").select("id").limit(1).single()

    const { data: country } = await supabase.from("countries").select("id").limit(1).single()

    if (!service || !country) {
      console.log("No services or countries found. Please seed them first.")
      return
    }

    // 3. Create test phone rentals
    const testRentals = [
      {
        user_id: testUserId,
        service_id: service.id,
        country_id: country.id,
        phone_number: "+1234567890",
        price: 50000,
        status: "active",
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: testUserId,
        service_id: service.id,
        country_id: country.id,
        phone_number: "+1234567891",
        price: 45000,
        status: "completed",
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        user_id: testUserId,
        service_id: service.id,
        country_id: country.id,
        phone_number: "+1234567892",
        price: 60000,
        status: "waiting",
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ]

    const { data: rentals, error: rentalsError } = await supabase.from("phone_rentals").insert(testRentals).select()

    if (rentalsError) {
      console.error("Error creating test rentals:", rentalsError)
      return
    }

    console.log(`Created ${rentals.length} test rentals`)

    // 4. Create test transactions
    const testTransactions = [
      {
        user_id: testUserId,
        type: "rental_purchase",
        amount: -50000,
        balance_after: 50000,
        status: "completed",
        description: "Test rental purchase",
      },
      {
        user_id: testUserId,
        type: "deposit",
        amount: 100000,
        balance_after: 100000,
        status: "completed",
        description: "Test deposit",
      },
    ]

    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .insert(testTransactions)
      .select()

    if (transactionsError) {
      console.error("Error creating test transactions:", transactionsError)
      return
    }

    console.log(`Created ${transactions.length} test transactions`)

    console.log("✅ Test data seeded successfully!")
    console.log("Dashboard should now display:")
    console.log("- 1 user")
    console.log("- 3 phone rentals")
    console.log("- 1 active rental")
    console.log("- Revenue from transactions")
  } catch (error) {
    console.error("Error seeding test data:", error)
  }
}

seedTestData()
