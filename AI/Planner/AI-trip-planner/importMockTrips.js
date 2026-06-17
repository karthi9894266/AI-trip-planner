const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

async function importMockTrips() {
  const uri = 'mongodb+srv://tripadmin:fqK1Ph5X5Bv4LZNc@cluster0.0tvb5qy.mongodb.net/trip?retryWrites=true&w=majority&appName=Cluster0'; 
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('trip'); // your DB name
    const tripsCollection = db.collection('user');

    // Read the JSON file
    const filePath = path.join(__dirname, 'mockTrips.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const trips = JSON.parse(rawData);

    // Convert date strings to Date objects
    trips.forEach(trip => {
      trip.startDate = new Date(trip.startDate);
      trip.endDate = new Date(trip.endDate);
    });

    const result = await tripsCollection.insertMany(trips);
    console.log(`${result.insertedCount} trips inserted successfully.`);
  } catch (error) {
    console.error('Error importing trips:', error);
  } finally {
    await client.close();
  }
}

importMockTrips();
