const mongoose = require('mongoose');
require('dotenv').config();
const Report = require('./src/models/Report');

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const doc = await Report.findOne({ report_id: 1 }).lean();
  console.log("Team info:", {
    handlingTeamId: doc.handlingTeamId,
    handlingTeamName: doc.handlingTeamName,
    assignedTeamId: doc.assignedTeamId,
    assignedTeamName: doc.assignedTeamName
  });
  process.exit();
});
