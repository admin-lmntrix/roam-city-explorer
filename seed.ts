import "dotenv/config";
import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { PlaceType } from "@prisma/client";
import { db } from "../lib/db";
import { slugify } from "../lib/slug";

type SeedPlace = { name: string; type: PlaceType; short: string; description: string; address: string; lat: number; lng: number; price: number; featured?: boolean };

// Coordinates are approximate (±~100 m) — verify before using for navigation.
const data: { city: { name: string; country: string; lat: number; lng: number }; places: SeedPlace[]; guide: { slug: string; title: string; description: string; order: string[] } }[] = [
  {
    city: { name: "Kolkata", country: "India", lat: 22.5726, lng: 88.3639 },
    places: [
      { name: "Kumartuli Walk", type: "HIDDEN_PLACE", price: 1, lat: 22.5961, lng: 88.3651, address: "Kumartuli, North Kolkata", short: "Old clay lanes and working studios tucked into north Kolkata.", description: "A maze of artisan studios where clay idols are shaped by hand." },
      { name: "Mitra Cafe", type: "FOOD", price: 1, lat: 22.5986, lng: 88.3636, address: "Shobhabazar, North Kolkata", short: "Classic local bites with decades of history.", description: "A beloved old-school stop for Bengali snacks and comfort food." },
      { name: "Prinsep Ghat", type: "ATTRACTION", price: 1, lat: 22.5545, lng: 88.3303, address: "Strand Road, Kolkata", short: "Go around golden hour and walk along the Hooghly.", description: "A riverside colonnade and one of the city's best sunset walks." },
      { name: "South Park Street Cemetery", type: "HISTORY", price: 1, lat: 22.5442, lng: 88.3631, address: "Park Street, Kolkata", short: "Quiet, historic and surprisingly cinematic.", description: "Atmospheric colonial-era cemetery with striking old monuments." },
      { name: "Rabindra Sarobar", type: "NATURE", price: 1, lat: 22.5105, lng: 88.3512, address: "Dhakuria, South Kolkata", short: "A calm break from the city's traffic.", description: "A leafy lake for an early walk, people watching and a slower Kolkata." }
    ],
    guide: {
      slug: "one-day-kolkata",
      title: "One day, deeply Kolkata",
      description: "A flexible day through craft, history, river air and classic local food.",
      order: ["Rabindra Sarobar", "Kumartuli Walk", "Mitra Cafe", "South Park Street Cemetery", "Prinsep Ghat"]
    }
  },
  {
    city: { name: "Jaipur", country: "India", lat: 26.9124, lng: 75.7873 },
    places: [
      { name: "Hawa Mahal", type: "ATTRACTION", price: 1, lat: 26.9239, lng: 75.8267, address: "Hawa Mahal Rd, Badi Choupad", short: "The honeycomb palace, best seen in morning light.", description: "The five-storey 'Palace of Winds' with hundreds of small latticed windows, built so royal women could watch street life unseen." },
      { name: "Jantar Mantar", type: "HISTORY", price: 1, lat: 26.9247, lng: 75.8244, address: "Gangori Bazaar, Jaipur", short: "A garden of giant astronomical instruments.", description: "An 18th-century observatory of oversized stone instruments that still tell time and track the stars." },
      { name: "Amber Fort", type: "ATTRACTION", price: 2, lat: 26.9855, lng: 75.8513, address: "Devisinghpura, Amer", short: "Hilltop fort with mirrored halls and long views.", description: "A sandstone-and-marble hilltop fort above Maota Lake, with courtyards, mirrored halls and ramparts." },
      { name: "Nahargarh Fort at Sunset", type: "HIDDEN_PLACE", price: 1, lat: 26.9372, lng: 75.8155, address: "Nahargarh Rd, Brahampuri", short: "Skip the crowds and watch the pink city light up.", description: "A ridge-top fort with a wide view over Jaipur — quieter than the big-name forts and great as the day ends." },
      { name: "Johari Bazaar", type: "SHOPPING", price: 2, lat: 26.9187, lng: 75.8250, address: "Johari Bazaar, Pink City", short: "Jewellery, textiles and gem-cutters' lanes.", description: "One of the old city's best-known markets for jewellery, block-printed textiles and lac bangles." }
    ],
    guide: {
      slug: "jaipur-pink-city-day",
      title: "A day in the Pink City",
      description: "Forts, observatories and bazaars in an order that avoids the midday heat.",
      order: ["Amber Fort", "Jantar Mantar", "Hawa Mahal", "Johari Bazaar", "Nahargarh Fort at Sunset"]
    }
  }
];

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== "ADMIN") await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    console.log(`Admin already exists: ${email}`);
    return;
  }
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || randomBytes(9).toString("base64url");
  await db.user.create({ data: { email, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) } });
  console.log(`Created admin ${email}${generated ? ` with generated password: ${password}  (save it now)` : " using ADMIN_PASSWORD"}`);
}

async function main() {
  for (const { city: c, places, guide: g } of data) {
    const city = await db.city.upsert({
      where: { slug: slugify(c.name) },
      update: { name: c.name, country: c.country, latitude: c.lat, longitude: c.lng },
      create: { name: c.name, slug: slugify(c.name), country: c.country, latitude: c.lat, longitude: c.lng }
    });

    const bySlug = new Map<string, string>();
    for (const p of places) {
      const slug = slugify(p.name);
      const fields = { name: p.name, description: p.description, shortDesc: p.short, type: p.type, address: p.address, latitude: p.lat, longitude: p.lng, priceLevel: p.price, featured: p.featured ?? true, cityId: city.id };
      const place = await db.place.upsert({ where: { slug }, update: fields, create: { slug, ...fields } });
      bySlug.set(p.name, place.id);
    }

    const guide = await db.guide.upsert({
      where: { slug: g.slug },
      update: { title: g.title, description: g.description, cityId: city.id },
      create: { slug: g.slug, title: g.title, description: g.description, cityId: city.id }
    });
    for (const [position, name] of g.order.entries()) {
      const placeId = bySlug.get(name)!;
      await db.guidePlace.upsert({
        where: { guideId_placeId: { guideId: guide.id, placeId } },
        update: { position },
        create: { guideId: guide.id, placeId, position }
      });
    }
  }
  await seedAdmin();
  console.log("Seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
