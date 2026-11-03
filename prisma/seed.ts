import { PrismaClient, DataConfidence, LeadSource, LeadStatus } from "@prisma/client";
import { runLeadAnalysis } from "../src/lib/analysis/pipeline";
import { seedDiscoveryProspects } from "../src/lib/discovery/service";
import { ingestFacebookLead } from "../src/lib/facebook/ingest";

const prisma = new PrismaClient();

type SeedCompany = {
  name: string;
  address?: string;
  postcode: string;
  city: string;
  county?: string;
  industry: string;
  employeeCount?: number;
  annualRevenue?: number;
  roofSizeSqm?: number;
  energyBillMonthly?: number;
  website?: string;
  contact: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    jobTitle?: string;
  };
  annualKwhUsage?: number;
  annualKwhSource?: DataConfidence;
  lead: {
    status: LeadStatus;
    source: LeadSource;
    notes: string;
    assignedTo?: string;
    estimatedKw?: number;
  };
};

const sampleData: SeedCompany[] = [
  {
    name: "Greenfield Manufacturing Ltd",
    address: "Unit 4, Riverside Industrial Estate",
    postcode: "M17 1WA",
    city: "Manchester",
    county: "Greater Manchester",
    industry: "Manufacturing",
    employeeCount: 85,
    annualRevenue: 4200000,
    roofSizeSqm: 2400,
    energyBillMonthly: 6800,
    website: "https://greenfield-mfg.co.uk",
    contact: {
      firstName: "Sarah",
      lastName: "Thompson",
      email: "s.thompson@greenfield-mfg.co.uk",
      phone: "+44 161 555 0142",
      jobTitle: "Operations Director",
    },
    annualKwhUsage: 326400,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "QUALIFIED",
      source: "AI_DISCOVERY",
      notes: "High energy consumption, south-facing roof. Interested in 250kW system with battery storage.",
      assignedTo: "James Mitchell",
      estimatedKw: 250,
    },
  },
  {
    name: "Thames Valley Logistics",
    address: "Distribution Park, Slough Trading Estate",
    postcode: "SL1 4DX",
    city: "Slough",
    county: "Berkshire",
    industry: "Logistics",
    employeeCount: 120,
    annualRevenue: 8500000,
    roofSizeSqm: 5200,
    energyBillMonthly: 12400,
    website: "https://thamesvalleylogistics.com",
    contact: {
      firstName: "David",
      lastName: "Chen",
      email: "d.chen@thamesvalleylogistics.com",
      phone: "+44 1753 555 0198",
      jobTitle: "Facilities Manager",
    },
    annualKwhUsage: 595200,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "PROPOSAL",
      source: "REFERRAL",
      notes: "Proposal sent for 450kW rooftop array. Awaiting board approval.",
      assignedTo: "James Mitchell",
      estimatedKw: 450,
    },
  },
  {
    name: "Cornwall Cold Storage",
    address: "Penryn Business Park",
    postcode: "TR10 8AA",
    city: "Penryn",
    county: "Cornwall",
    industry: "Food & Beverage",
    employeeCount: 45,
    annualRevenue: 2100000,
    roofSizeSqm: 1800,
    energyBillMonthly: 9200,
    website: "https://cornwallcoldstorage.co.uk",
    contact: {
      firstName: "Emma",
      lastName: "Williams",
      email: "emma.w@cornwallcoldstorage.co.uk",
      phone: "+44 1326 555 0176",
      jobTitle: "Managing Director",
    },
    annualKwhUsage: 441600,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "NEGOTIATION",
      source: "TRADE_SHOW",
      notes: "Refrigeration loads make solar highly attractive. Negotiating PPA terms.",
      assignedTo: "Priya Sharma",
      estimatedKw: 180,
    },
  },
  {
    name: "Edinburgh Tech Hub",
    address: "Quartermile, Lauriston Place",
    postcode: "EH3 9DR",
    city: "Edinburgh",
    county: "Midlothian",
    industry: "Technology",
    employeeCount: 200,
    annualRevenue: 15000000,
    roofSizeSqm: 1200,
    energyBillMonthly: 4500,
    website: "https://edinburghtechhub.scot",
    contact: {
      firstName: "Andrew",
      lastName: "Fraser",
      email: "a.fraser@edinburghtechhub.scot",
      phone: "+44 131 555 0134",
      jobTitle: "Sustainability Lead",
    },
    annualKwhUsage: 216000,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "CONTACTED",
      source: "WEBSITE",
      notes: "Enquiry via website form. ESG targets for 2027. Follow-up call scheduled.",
      assignedTo: "Priya Sharma",
      estimatedKw: 95,
    },
  },
  {
    name: "Birmingham Auto Parts",
    address: "Tyseley Industrial Estate",
    postcode: "B11 2BE",
    city: "Birmingham",
    county: "West Midlands",
    industry: "Automotive",
    employeeCount: 60,
    annualRevenue: 3800000,
    roofSizeSqm: 3100,
    energyBillMonthly: 5100,
    website: "https://birminghamautoparts.co.uk",
    contact: {
      firstName: "Mohammed",
      lastName: "Khan",
      email: "m.khan@birminghamautoparts.co.uk",
      phone: "+44 121 555 0167",
      jobTitle: "General Manager",
    },
    annualKwhUsage: 244800,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "NEW",
      source: "COLD_OUTREACH",
      notes: "Identified via AI roof analysis. Large flat roof, good irradiance.",
      assignedTo: "James Mitchell",
      estimatedKw: 320,
    },
  },
  {
    name: "Norfolk Agri-Processing",
    address: "Agricultural Park, Dereham Road",
    postcode: "NR20 3AA",
    city: "Swaffham",
    county: "Norfolk",
    industry: "Agriculture",
    employeeCount: 35,
    annualRevenue: 1800000,
    roofSizeSqm: 4500,
    energyBillMonthly: 3800,
    website: "https://norfolkagri.co.uk",
    contact: {
      firstName: "Helen",
      lastName: "Clarkson",
      email: "h.clarkson@norfolkagri.co.uk",
      phone: "+44 1760 555 0189",
      jobTitle: "Owner",
    },
    lead: {
      status: "QUALIFIED",
      source: "PARTNER",
      notes: "Referred by agricultural consultant. Ground-mount also possible on adjacent land.",
      assignedTo: "Priya Sharma",
      estimatedKw: 400,
    },
  },
  {
    name: "Leeds Print Solutions",
    address: "Hunslet Trading Estate",
    postcode: "LS10 1DJ",
    city: "Leeds",
    county: "West Yorkshire",
    industry: "Printing",
    employeeCount: 28,
    annualRevenue: 1200000,
    roofSizeSqm: 900,
    energyBillMonthly: 2900,
    contact: {
      firstName: "Robert",
      lastName: "Hughes",
      email: "r.hughes@leedsprintsolutions.co.uk",
      jobTitle: "Director",
    },
    lead: {
      status: "CONTACTED",
      source: "WEBSITE",
      notes: "Smaller roof but high daytime consumption. Sent initial feasibility report. Phone number and website not on file.",
      assignedTo: "James Mitchell",
      estimatedKw: 75,
    },
  },
  {
    name: "Cardiff Data Centre Ltd",
    address: "Capital Business Park",
    postcode: "CF3 0LT",
    city: "Cardiff",
    county: "South Glamorgan",
    industry: "Data Centres",
    employeeCount: 40,
    annualRevenue: 6000000,
    roofSizeSqm: 800,
    energyBillMonthly: 18500,
    website: "https://cardiffdatacentre.wales",
    contact: {
      firstName: "Gareth",
      lastName: "Evans",
      email: "g.evans@cardiffdatacentre.wales",
      phone: "+44 29 555 0123",
      jobTitle: "CTO",
    },
    annualKwhUsage: 1008000,
    annualKwhSource: "VERIFIED",
    lead: {
      status: "WON",
      source: "AI_DISCOVERY",
      notes: "Contract signed for 120kW + battery. Installation Q2 2026.",
      assignedTo: "Priya Sharma",
      estimatedKw: 120,
    },
  },
  {
    name: "Glasgow Brewery Co",
    address: "Gorbals Street",
    postcode: "G5 0DS",
    city: "Glasgow",
    county: "Lanarkshire",
    industry: "Food & Beverage",
    employeeCount: 55,
    annualRevenue: 3200000,
    roofSizeSqm: 1500,
    energyBillMonthly: 4200,
    website: "https://glasgowbrewery.co.uk",
    contact: {
      firstName: "Fiona",
      lastName: "MacLeod",
      email: "f.macleod@glasgowbrewery.co.uk",
      phone: "+44 141 555 0144",
      jobTitle: "Operations Manager",
    },
    lead: {
      status: "LOST",
      source: "REFERRAL",
      notes: "Chose competitor due to lower upfront cost. Revisit in 12 months.",
      assignedTo: "James Mitchell",
      estimatedKw: 140,
    },
  },
  {
    name: "Bristol Green Offices",
    address: "Temple Quay",
    postcode: "BS1 6EE",
    city: "Bristol",
    county: "Avon",
    industry: "Commercial Real Estate",
    employeeCount: 15,
    roofSizeSqm: 600,
    contact: {
      firstName: "Lucy",
      lastName: "Patel",
      email: "l.patel@bristolgreenoffices.co.uk",
      phone: "+44 117 555 0199",
      jobTitle: "Property Manager",
    },
    lead: {
      status: "NEW",
      source: "WEBSITE",
      notes: "Multi-tenant building. Exploring shared solar scheme. Website, energy bill, annual kWh, revenue, and system size are not yet confirmed — left unknown.",
      assignedTo: "Priya Sharma",
    },
  },
  {
    name: "Newcastle Shipyard Services",
    address: "Walker Riverside",
    postcode: "NE6 3NL",
    city: "Newcastle upon Tyne",
    county: "Tyne and Wear",
    industry: "Marine Engineering",
    employeeCount: 95,
    annualRevenue: 7200000,
    roofSizeSqm: 3800,
    energyBillMonthly: 7800,
    website: "https://newcastleshipyard.co.uk",
    contact: {
      firstName: "Michael",
      lastName: "Brown",
      email: "m.brown@newcastleshipyard.co.uk",
      phone: "+44 191 555 0171",
      jobTitle: "Engineering Director",
    },
    annualKwhUsage: 374400,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "PROPOSAL",
      source: "AI_DISCOVERY",
      notes: "Large workshop with welding loads. 380kW proposal under review.",
      assignedTo: "James Mitchell",
      estimatedKw: 380,
    },
  },
  {
    name: "Oxford University Press Warehouse",
    address: "Banbury Road Industrial",
    postcode: "OX2 8JD",
    city: "Oxford",
    county: "Oxfordshire",
    industry: "Publishing",
    employeeCount: 70,
    annualRevenue: 4500000,
    roofSizeSqm: 2200,
    energyBillMonthly: 3600,
    website: "https://oupwarehouse.co.uk",
    contact: {
      firstName: "James",
      lastName: "Wright",
      email: "j.wright@oupwarehouse.co.uk",
      phone: "+44 1865 555 0162",
      jobTitle: "Warehouse Manager",
    },
    annualKwhUsage: 172800,
    annualKwhSource: "ESTIMATED",
    lead: {
      status: "CONTACTED",
      source: "PARTNER",
      notes: "Corporate sustainability mandate. Initial site survey completed.",
      assignedTo: "Priya Sharma",
      estimatedKw: 200,
    },
  },
];

async function main() {
  console.log("Seeding database...");

  await prisma.leadAnalysis.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.company.deleteMany();
  await seedDiscoveryProspects();

  const leadIds: string[] = [];

  for (const item of sampleData) {
    const company = await prisma.company.create({
      data: {
        name: item.name,
        address: item.address,
        postcode: item.postcode,
        city: item.city,
        county: item.county,
        industry: item.industry,
        employeeCount: item.employeeCount,
        annualRevenue: item.annualRevenue,
        roofSizeSqm: item.roofSizeSqm,
        energyBillMonthly: item.energyBillMonthly,
        annualKwhUsage: item.annualKwhUsage,
        annualKwhSource: item.annualKwhSource ?? "UNKNOWN",
        website: item.website,
      },
    });

    const contact = await prisma.contact.create({
      data: {
        companyId: company.id,
        firstName: item.contact.firstName,
        lastName: item.contact.lastName,
        email: item.contact.email,
        phone: item.contact.phone,
        jobTitle: item.contact.jobTitle,
        isPrimary: true,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        status: item.lead.status,
        source: item.lead.source,
        notes: item.lead.notes,
        assignedTo: item.lead.assignedTo,
        estimatedKw: item.lead.estimatedKw,
        estimatedKwSource: item.lead.estimatedKw != null ? "ESTIMATED" : "UNKNOWN",
      },
    });

    leadIds.push(lead.id);
  }

  console.log(`Seeded ${sampleData.length} companies with contacts and leads.`);
  console.log("Seeded 8 discovery prospects (not yet imported).");
  console.log("Missing fields are stored as unknown — kWh is never inferred from bills.");

  console.log("Running AI analysis pipeline on all leads...");
  for (const leadId of leadIds) {
    await runLeadAnalysis(leadId);
  }

  console.log(`Analysis complete for ${leadIds.length} leads.`);

  console.log("Seeding sample Facebook Instant Form leads...");
  await ingestFacebookLead({
    firstName: "Amira",
    lastName: "Khan",
    email: "amira.khan@example.com",
    phone: "+44 7700 900123",
    postcode: "M14 5TP",
    city: "Manchester",
    homeowner: true,
    billBand: "100_150",
    roofType: "Pitched tile",
    timeline: "3_months",
    consentToCall: true,
    facebookLeadId: "seed_fb_amira",
  });
  await ingestFacebookLead({
    firstName: "Tom",
    lastName: "Reed",
    email: "tom.reed@example.com",
    phone: "+44 7700 900456",
    postcode: "BS6 6EH",
    city: "Bristol",
    homeowner: true,
    billBand: "150_plus",
    roofType: "Slate",
    timeline: "now",
    consentToCall: true,
    facebookLeadId: "seed_fb_tom",
  });
  await ingestFacebookLead({
    firstName: "Chloe",
    lastName: "Nash",
    phone: "+44 7700 900789",
    postcode: "LS6 1AA",
    city: "Leeds",
    homeowner: false,
    billBand: "50_100",
    timeline: "researching",
    consentToCall: false,
    facebookLeadId: "seed_fb_chloe",
  });
  console.log("Seeded 3 Facebook leads (no calls or emails sent).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
