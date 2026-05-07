const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }).then(async () => {
  console.log("Connected. Dropping indexes...");
  try {
    const db = mongoose.connection.db;
    const reportsCollection = db.collection('reports');
    const indexes = await reportsCollection.indexes();
    console.log("Current indexes:", indexes.map(i => i.name));
    
    for (let index of indexes) {
      if (index.name !== '_id_') {
        console.log(`Dropping index ${index.name}...`);
        try {
          await reportsCollection.dropIndex(index.name);
          console.log(`Dropped ${index.name}`);
        } catch(e) {
          console.log(`Failed to drop ${index.name}:`, e.message);
        }
      }
    }
  } catch (err) {
    console.error("Err:", err);
  }
  process.exit(0);
});
