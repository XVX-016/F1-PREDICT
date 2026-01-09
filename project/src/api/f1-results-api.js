const F1ResultsScraper = require('../../scraper/f1-results-scraper');

let scraper = null;

const initializeScraper = async () => {
  if (!scraper) {
    scraper = new F1ResultsScraper();
    await scraper.initialize();
  }
  return scraper;
};

const cleanupScraper = async () => {
  if (scraper) {
    await scraper.close();
    scraper = null;
  }
};

export const scrapeF1Results = async (req, res) => {
  const { raceName, year = '2025' } = req.body;

  if (!raceName) {
    return res.status(400).json({ error: 'Race name is required' });
  }

  try {
    console.log(`🏁 Scraping F1 results for: ${raceName} ${year}`);
    
    const scraper = await initializeScraper();
    const results = await scraper.scrapeRaceResults(raceName, year);

    if (results && results.length > 0) {
      console.log(`✅ Found ${results.length} results for ${raceName}`);
      return res.json({
        success: true,
        results: results,
        message: `Successfully scraped ${results.length} results for ${raceName}`
      });
    } else {
      console.log(`❌ No results found for ${raceName}`);
      return res.json({
        success: false,
        results: [],
        message: `No results found for ${raceName}`
      });
    }

  } catch (error) {
    console.error('❌ Error scraping F1 results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scrape F1 results',
      message: error.message
    });
  }
};

export const scrapeCurrentSeasonResults = async (req, res) => {
  try {
    console.log('🏁 Scraping current season results...');
    
    const scraper = await initializeScraper();
    const results = await scraper.scrapeCurrentSeasonResults();

    if (results && Object.keys(results).length > 0) {
      console.log(`✅ Found results for ${Object.keys(results).length} races`);
      return res.json({
        success: true,
        results: results,
        message: `Successfully scraped results for ${Object.keys(results).length} races`
      });
    } else {
      console.log('❌ No season results found');
      return res.json({
        success: false,
        results: {},
        message: 'No season results found'
      });
    }

  } catch (error) {
    console.error('❌ Error scraping season results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scrape season results',
      message: error.message
    });
  }
};

export const getRaceResults = async (req, res) => {
  const { raceName, year = '2025' } = req.query;

  if (!raceName) {
    return res.status(400).json({ error: 'Race name is required' });
  }

  try {
    console.log(`🏁 Getting F1 results for: ${raceName} ${year}`);
    
    const scraper = await initializeScraper();
    const results = await scraper.scrapeRaceResults(raceName, year);

    if (results && results.length > 0) {
      console.log(`✅ Found ${results.length} results for ${raceName}`);
      return res.json({
        success: true,
        results: results,
        message: `Successfully retrieved ${results.length} results for ${raceName}`
      });
    } else {
      console.log(`❌ No results found for ${raceName}`);
      return res.json({
        success: false,
        results: [],
        message: `No results found for ${raceName}`
      });
    }

  } catch (error) {
    console.error('❌ Error getting F1 results:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get F1 results',
      message: error.message
    });
  }
};

// Cleanup function for graceful shutdown
export const cleanup = async () => {
  await cleanupScraper();
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('🔄 Shutting down F1 Results API...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down F1 Results API...');
  await cleanup();
  process.exit(0);
});
