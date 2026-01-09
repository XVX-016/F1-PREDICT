#!/usr/bin/env ts-node

/**
 * Generate predictions for all 2025 F1 tracks
 * This script uses the EnhancedCalibrationService to generate track-specific predictions
 * for all 20 drivers in the 2025 F1 season.
 */

import { enhancedCalibrationService } from '../src/services/enhancedCalibration';
import { trackPredictionService } from '../src/services/TrackPredictionService';

async function generateAllTrackPredictions() {
  console.log('🏁 F1 2025 Track Predictions Generator');
  console.log('=====================================');
  console.log('');

  try {
    // Get all 2025 tracks
    const allTracks = trackPredictionService.getAllTracks();
    console.log(`📅 Found ${allTracks.length} tracks in 2025 F1 calendar`);
    console.log('');

    // Generate predictions for each track
    const allPredictions = await trackPredictionService.generateAllTrackPredictions();
    
    console.log('');
    console.log('🎯 Prediction Summary:');
    console.log('=====================');
    
    // Display predictions for each track
    allPredictions.forEach((trackPrediction, index) => {
      console.log(`\n${index + 1}. ${trackPrediction.trackName}`);
      console.log(`   Circuit: ${trackPrediction.circuit}`);
      console.log(`   Date: ${trackPrediction.date}`);
      console.log(`   Type: ${trackPrediction.trackType}`);
      console.log(`   Difficulty: ${trackPrediction.difficulty}`);
      console.log(`   Weather: ${trackPrediction.weather.condition}, ${trackPrediction.weather.tempC}°C, ${trackPrediction.weather.rainChancePct}% rain`);
      console.log('');
      console.log('   🏆 Top 3 Predictions:');
      
      trackPrediction.predictions.slice(0, 3).forEach((driver, pos) => {
        const position = pos + 1;
        const emoji = position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉';
        console.log(`   ${emoji} ${driver.position}. ${driver.driverName} (${driver.team})`);
        console.log(`      Win: ${(driver.winProbability * 100).toFixed(1)}% | Podium: ${(driver.podiumProbability * 100).toFixed(1)}%`);
      });
      
      console.log('');
      console.log('   📊 Full Grid:');
      trackPrediction.predictions.forEach((driver, pos) => {
        const position = pos + 1;
        const winPct = (driver.winProbability * 100).toFixed(1);
        const podiumPct = (driver.podiumProbability * 100).toFixed(1);
        console.log(`   ${position.toString().padStart(2, ' ')}. ${driver.driverName.padEnd(20)} | ${driver.team.padEnd(15)} | Win: ${winPct.padStart(5)}% | Podium: ${podiumPct.padStart(5)}%`);
      });
      
      console.log('   ' + '─'.repeat(80));
    });

    // Generate summary statistics
    console.log('\n📈 Season Prediction Summary:');
    console.log('============================');
    
    // Count wins by driver
    const driverWins: { [key: string]: number } = {};
    const driverPodiums: { [key: string]: number } = {};
    
    allPredictions.forEach(trackPrediction => {
      trackPrediction.predictions.slice(0, 3).forEach((driver, pos) => {
        const driverName = driver.driverName;
        if (pos === 0) {
          driverWins[driverName] = (driverWins[driverName] || 0) + 1;
        }
        driverPodiums[driverName] = (driverPodiums[driverName] || 0) + 1;
      });
    });

    // Sort drivers by wins
    const sortedDrivers = Object.entries(driverWins)
      .sort(([,a], [,b]) => b - a)
      .map(([driver, wins]) => ({ driver, wins, podiums: driverPodiums[driver] || 0 }));

    console.log('\n🏆 Predicted Season Champions:');
    sortedDrivers.slice(0, 10).forEach((driver, index) => {
      const position = index + 1;
      const emoji = position === 1 ? '👑' : position <= 3 ? '🥇' : '🏆';
      console.log(`${emoji} ${position}. ${driver.driver} - ${driver.wins} wins, ${driver.podiums} podiums`);
    });

    // Track type analysis
    console.log('\n🏁 Track Type Analysis:');
    const trackTypeStats: { [key: string]: { count: number; winners: string[] } } = {};
    
    allPredictions.forEach(trackPrediction => {
      const trackType = trackPrediction.trackType;
      const winner = trackPrediction.predictions[0].driverName;
      
      if (!trackTypeStats[trackType]) {
        trackTypeStats[trackType] = { count: 0, winners: [] };
      }
      trackTypeStats[trackType].count++;
      trackTypeStats[trackType].winners.push(winner);
    });

    Object.entries(trackTypeStats).forEach(([trackType, stats]) => {
      console.log(`\n${trackType.replace('_', ' ').toUpperCase()}:`);
      console.log(`   Races: ${stats.count}`);
      
      // Count wins by driver for this track type
      const winsByDriver: { [key: string]: number } = {};
      stats.winners.forEach(winner => {
        winsByDriver[winner] = (winsByDriver[winner] || 0) + 1;
      });
      
      const topDrivers = Object.entries(winsByDriver)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);
      
      console.log(`   Top drivers: ${topDrivers.map(([driver, wins]) => `${driver} (${wins})`).join(', ')}`);
    });

    // Team analysis
    console.log('\n🏎️ Team Performance Analysis:');
    const teamWins: { [key: string]: number } = {};
    const teamPodiums: { [key: string]: number } = {};
    
    allPredictions.forEach(trackPrediction => {
      trackPrediction.predictions.slice(0, 3).forEach((driver, pos) => {
        const team = driver.team;
        if (pos === 0) {
          teamWins[team] = (teamWins[team] || 0) + 1;
        }
        teamPodiums[team] = (teamPodiums[team] || 0) + 1;
      });
    });

    const sortedTeams = Object.entries(teamWins)
      .sort(([,a], [,b]) => b - a)
      .map(([team, wins]) => ({ team, wins, podiums: teamPodiums[team] || 0 }));

    console.log('\n🏆 Predicted Constructor Standings:');
    sortedTeams.forEach((team, index) => {
      const position = index + 1;
      const emoji = position === 1 ? '🏆' : position <= 3 ? '🥇' : '🏎️';
      console.log(`${emoji} ${position}. ${team.team} - ${team.wins} wins, ${team.podiums} podiums`);
    });

    console.log('\n✅ All track predictions generated successfully!');
    console.log(`📊 Total predictions: ${allPredictions.length} tracks × 20 drivers = ${allPredictions.length * 20} predictions`);
    
    // Save predictions to file
    const fs = require('fs');
    const predictionsData = {
      generatedAt: new Date().toISOString(),
      totalTracks: allPredictions.length,
      totalDrivers: 20,
      predictions: allPredictions.map(trackPrediction => ({
        trackName: trackPrediction.trackName,
        circuit: trackPrediction.circuit,
        date: trackPrediction.date,
        trackType: trackPrediction.trackType,
        difficulty: trackPrediction.difficulty,
        weather: trackPrediction.weather,
        predictions: trackPrediction.predictions.map(driver => ({
          driverName: driver.driverName,
          team: driver.team,
          position: driver.position,
          winProbability: driver.winProbability,
          podiumProbability: driver.podiumProbability
        }))
      }))
    };

    fs.writeFileSync(
      '2025_track_predictions.json', 
      JSON.stringify(predictionsData, null, 2)
    );
    
    console.log('💾 Predictions saved to 2025_track_predictions.json');

  } catch (error) {
    console.error('❌ Error generating track predictions:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  generateAllTrackPredictions();
}

export default generateAllTrackPredictions;
