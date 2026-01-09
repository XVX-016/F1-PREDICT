import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { generatePrediction, getWeatherForecast } from '../routes/races.js';

class CronService {
  constructor() {
    this.init();
  }

  init() {
    // Run every 30 minutes
    cron.schedule('*/30 * * * *', () => {
      this.updateRaceStatuses();
      this.preGenerateNextRacePrediction();
    });

    // Run every 2 minutes if race is within 24 hours
    cron.schedule('*/2 * * * *', () => {
      this.checkUpcomingRaces();
    });

    console.log('Cron service initialized');
  }

  async updateRaceStatuses() {
    try {
      const now = new Date();
      
      // Get all races for current season
      const racesRef = db.collection('races').where('season', '==', 2025);
      const snapshot = await racesRef.get();
      
      const batch = db.batch();
      
      snapshot.forEach(doc => {
        const race = doc.data();
        const raceDate = new Date(race.startDate || race.date_time);
        const endDate = new Date(race.endDate || raceDate.getTime() + (3 * 60 * 60 * 1000));
        
        let newStatus = 'upcoming';
        if (raceDate <= now) {
          if (now <= endDate) {
            newStatus = 'live';
          } else {
            newStatus = 'finished';
          }
        }
        
        // Only update if status changed
        if (race.status !== newStatus) {
          const raceRef = db.collection('races').doc(doc.id);
          batch.update(raceRef, { 
            status: newStatus,
            updated_at: new Date().toISOString()
          });
        }
      });
      
      await batch.commit();
      console.log('Race statuses updated');
    } catch (error) {
      console.error('Error updating race statuses:', error);
    }
  }

  async preGenerateNextRacePrediction() {
    try {
      // Get next race
      const racesRef = db.collection('races').where('season', '==', 2025);
      const snapshot = await racesRef.orderBy('round').get();
      
      if (snapshot.empty) return;
      
      const races = [];
      const now = new Date();
      
      snapshot.forEach(doc => {
        const race = doc.data();
        const raceDate = new Date(race.startDate || race.date_time);
        
        let status = 'upcoming';
        if (raceDate <= now) {
          const endDate = new Date(race.endDate || raceDate.getTime() + (3 * 60 * 60 * 1000));
          if (now <= endDate) {
            status = 'live';
          } else {
            status = 'finished';
          }
        }
        
        races.push({
          id: doc.id,
          ...race,
          status
        });
      });
      
      const nextRace = races
        .filter(r => r.status !== "finished")
        .sort((a, b) => new Date(a.startDate || a.date_time).getTime() - new Date(b.startDate || b.date_time).getTime())[0];
      
      if (!nextRace) return;
      
      // Check if prediction already exists
      const predictionRef = db.collection('predictions').doc(`${nextRace.id}:default`);
      const predictionDoc = await predictionRef.get();
      
      if (predictionDoc.exists) {
        // Check if prediction is older than 6 hours
        const prediction = predictionDoc.data();
        const generatedAt = new Date(prediction.generatedAt);
        const sixHoursAgo = new Date(now.getTime() - (6 * 60 * 60 * 1000));
        
        if (generatedAt > sixHoursAgo) {
          return; // Prediction is still fresh
        }
      }
      
      // Generate new prediction
      const weather = await getWeatherForecast(nextRace);
      const prediction = await generatePrediction(nextRace, weather);
      
      // Store prediction
      await predictionRef.set(prediction);
      
      console.log(`Pre-generated prediction for ${nextRace.name}`);
    } catch (error) {
      console.error('Error pre-generating prediction:', error);
    }
  }

  async checkUpcomingRaces() {
    try {
      const now = new Date();
      const twentyFourHoursFromNow = new Date(now.getTime() + (24 * 60 * 60 * 1000));
      
      // Get races starting within 24 hours
      const racesRef = db.collection('races').where('season', '==', 2025);
      const snapshot = await racesRef.get();
      
      const upcomingRaces = [];
      
      snapshot.forEach(doc => {
        const race = doc.data();
        const raceDate = new Date(race.startDate || race.date_time);
        
        if (raceDate >= now && raceDate <= twentyFourHoursFromNow) {
          upcomingRaces.push({
            id: doc.id,
            ...race
          });
        }
      });
      
      if (upcomingRaces.length > 0) {
        // Increase refresh frequency for upcoming races
        console.log(`${upcomingRaces.length} race(s) starting within 24 hours`);
        
        // You could emit WebSocket events here to notify clients
        // or trigger additional prediction updates
      }
    } catch (error) {
      console.error('Error checking upcoming races:', error);
    }
  }
}

export default new CronService();
