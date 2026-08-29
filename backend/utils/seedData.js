// ============================================================
// utils/seedData.js - Demo Data Seeder
// Run: cd backend && node utils/seedData.js
// ============================================================
require('dotenv').config();
const mongoose = require('mongoose');
const User    = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Tour    = require('../models/Tour');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/banjare');
  console.log('Connected to MongoDB');
  await User.deleteMany({}); await Vehicle.deleteMany({}); await Tour.deleteMany({});

  const admin = await User.create({ name:'Banjare Admin', email:'admin@banjare.in', passwordHash:'Admin@1234', role:'admin', phone:'9000000001' });
  const owner = await User.create({ name:'Ramesh Negi', email:'owner@banjare.in', passwordHash:'Owner@1234', role:'owner', phone:'9557166769' });
  const user  = await User.create({ name:'Priya Sharma', email:'user@banjare.in', passwordHash:'User@1234', role:'user', phone:'9876543210' });

  await Vehicle.insertMany([
    { ownerId:owner._id, make:'Toyota', model:'Innova Crysta', year:2022, vehicleType:'innova', seats:7, fuelType:'diesel', pricePerDay:3500, city:'Rishikesh', registrationNumber:'UK07-AB-1234', features:['AC','GPS','Music System'], isApproved:true, rating:4.5, totalRatings:12 },
    { ownerId:owner._id, make:'Mahindra', model:'Scorpio N', year:2023, vehicleType:'suv', seats:7, fuelType:'diesel', pricePerDay:3000, city:'Dehradun', registrationNumber:'UK07-CD-5678', features:['AC','Music System'], isApproved:true, rating:4.2, totalRatings:8 },
    { ownerId:owner._id, make:'Force', model:'Tempo Traveller 14', year:2021, vehicleType:'tempo-traveller', seats:14, fuelType:'diesel', pricePerDay:6000, city:'Haridwar', registrationNumber:'UK07-EF-9012', features:['AC','Push-Back Seats'], isApproved:true, rating:4.7, totalRatings:20 },
    { ownerId:owner._id, make:'Toyota', model:'Fortuner', year:2022, vehicleType:'suv', seats:7, fuelType:'diesel', pricePerDay:5500, city:'Nainital', registrationNumber:'UK03-KL-2345', features:['AC','GPS','Music System','Luggage Carrier'], isApproved:true, rating:4.8, totalRatings:22 },
    { ownerId:owner._id, make:'Mahindra', model:'Bolero', year:2020, vehicleType:'bolero', seats:9, fuelType:'diesel', pricePerDay:2800, city:'Kedarnath', registrationNumber:'UK05-IJ-7890', features:['Non-AC','First Aid Kit'], isApproved:true, rating:4.3, totalRatings:15 },
  ]);

  await Tour.insertMany([
    { ownerId:owner._id, title:'Char Dham Yatra – Complete Package', description:'The holiest pilgrimage covering all four dhams.', price:18999, durationDays:12, itinerary:'Day 1: Haridwar-Barkot. Day 2-3: Yamunotri. Day 4-5: Gangotri. Day 6-7: Kedarnath. Day 8-9: Badrinath. Day 10-12: Return.', destinations:['Yamunotri','Gangotri','Kedarnath','Badrinath'], startCity:'Haridwar', tourType:'pilgrimage', includes:['Vehicle','Accommodation','Driver'], difficulty:'moderate', maxGroupSize:12, isApproved:true, rating:4.8 },
    { ownerId:owner._id, title:'Rishikesh Adventure Weekend', description:'3 days of rafting, bungee, camping and yoga.', price:5999, durationDays:3, itinerary:'Day 1: Rafting. Day 2: Bungee+Cliff Jump. Day 3: Camping+Yoga.', destinations:['Rishikesh','Shivpuri'], startCity:'Rishikesh', tourType:'adventure', includes:['Transport','Camping','Meals'], difficulty:'moderate', maxGroupSize:15, isApproved:true, rating:4.6 },
    { ownerId:owner._id, title:'Jim Corbett Wildlife Safari', description:'3-day jungle safari in India oldest national park.', price:8999, durationDays:3, itinerary:'Day 1: Bijrani Safari. Day 2: Dhikala full day. Day 3: Jhirna Zone.', destinations:['Jim Corbett','Ramnagar'], startCity:'Jim Corbett', tourType:'wildlife', includes:['Resort','Safari Fees','Jeep'], difficulty:'easy', maxGroupSize:8, isApproved:true, rating:4.5 },
  ]);

  console.log('\nSEED COMPLETE!\nAdmin: admin@banjare.in / Admin@1234\nOwner: owner@banjare.in / Owner@1234\nUser:  user@banjare.in / User@1234');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
