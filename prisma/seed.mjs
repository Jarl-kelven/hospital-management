// prisma/seed.mjs
import "dotenv/config"; // so this also works via a plain `node prisma/seed.mjs`
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prefer the unpooled/direct connection for one-off scripts like seeding.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;

// Check BEFORE using the value — the old version called .slice() on it first,
// which threw "Cannot read properties of undefined" instead of this message.
if (!connectionString) {
  throw new Error("Missing DIRECT_URL or DATABASE_URL in your env file.");
}

// Prisma 7's adapter takes the connection string directly; it manages
// its own pool, so there's no need to construct a Pool by hand.
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

/**
 * The three doctors that used to live in data/doctors.ts, moved here so the
 * database starts with the same content. The admin can add more from
 * /admin/doctors, and these photos already exist in public/images.
 */
const startingDoctors = [
  {
    name: "Dr. John Simmmons",
    specialization: "Surgeon",
    hospital: "Silicon Hospital, Opic.",
    photoUrl: "/images/doc1.png",
    avgRating: 4.8,
    totalRating: 272,
    totalPatients: 1100,
  },
  {
    name: "Dr. Michael Mel-Smith",
    specialization: "Neurologist",
    hospital: "Silicon Hospital, Opic.",
    photoUrl: "/images/doc2.png",
    avgRating: 5.0,
    totalRating: 272,
    totalPatients: 1800,
  },
  {
    name: "Dr. Joseph Samuels",
    specialization: "Dermatologist",
    hospital: "Silicon Hospital, Opic.",
    photoUrl: "/images/doc3.png",
    avgRating: 4.7,
    totalRating: 272,
    totalPatients: 1200,
  },
];

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "Admin";

  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD in your env file.");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: "ADMIN" },
    create: { name, email, passwordHash, role: "ADMIN" },
  });

  console.log(`Seeded admin: ${email}`);

  // Only add the starting doctors if the table is empty. That way you can run
  // `npm run db:seed` again safely without ending up with duplicates.
  const existingDoctors = await prisma.doctor.count();

  if (existingDoctors === 0) {
    await prisma.doctor.createMany({ data: startingDoctors });
    console.log(`Seeded ${startingDoctors.length} doctors`);
  } else {
    console.log(`Skipped doctors — ${existingDoctors} already in the database`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
