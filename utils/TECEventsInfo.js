const fs = require('fs');
const xml2js = require('xml2js');

// Utility function to clean title and remove special characters
function cleanText(text) {
  return text
    .normalize('NFD') // Normalize Unicode to decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\\|\"/g, '') // Remove backslashes and quotes
    .replace(/<\/?[^>]+(>|$)/g, '') // Remove XML/HTML tags
    .trim(); // Trim any extra spaces
}

// Function to extract recurrence rules from the serialized string
function parseRecurrence(recurrenceStr) {
  try {
    const rules = recurrenceStr.match(/s:4:"type";s:\d+:"(.*?)"/);
    const interval = recurrenceStr.match(/s:8:"interval";s:\d+:"(.*?)"/);
    const days = recurrenceStr.match(/s:3:"day";a:\d+:{i:\d+;s:\d+:"(.*?)"/);
    const startDate = recurrenceStr.match(/s:14:"EventStartDate";s:\d+:"(.*?)"/);
    const endDate = recurrenceStr.match(/s:12:"EventEndDate";s:\d+:"(.*?)"/);
    const endType = recurrenceStr.match(/s:8:"end-type";s:\d+:"(.*?)"/);
    const exclusions = recurrenceStr.match(/s:10:"exclusions";a:\d+:{(.*?)}/);

    return {
      type: rules ? rules[1] : 'Unknown',
      interval: interval ? interval[1] : 'Unknown',
      dayOfWeek: days ? days[1] : 'Unknown',
      startDate: startDate ? startDate[1] : 'Unknown',
      endDate: endDate ? endDate[1] : 'Unknown',
      endType: endType ? endType[1] : 'Unknown',
      exclusions: exclusions ? exclusions[1] : 'None',
    };
  } catch (error) {
    console.error('Error parsing recurrence:', error);
    return {};
  }
}

// Parsing XML and organizing by event title
const xmlFilePath = './utils/XMLData4Cutover/bostontangocalendar.WordPress.2024-10-03.events.xml';
const outputFilePath = './utils/XMLData4Cutover/logs/EventInfo.json';

fs.readFile(xmlFilePath, (err, data) => {
  if (err) throw err;

  const parser = new xml2js.Parser();

  // Parse the XML data
  parser.parseString(data, (err, result) => {
    if (err) throw err;

    const events = result.rss.channel[0].item;
    let eventGroups = {};

    // Traverse through each event
    events.forEach(event => {
      const title = cleanText(event.title[0]);
      const description = event.description && event.description[0] ? cleanText(event.description[0]) : '';
      const contentEncoded = event['content:encoded'] && event['content:encoded'][0] ? cleanText(event['content:encoded'][0]) : '';
      const imageLink = event['wp:attachment_url'] ? event['wp:attachment_url'][0] : '';
      const organizer = event['dc:creator'] ? cleanText(event['dc:creator'][0]) : '';

// Ensure category exists before attempting to filter
const categories = event.category ? event.category
    .filter(cat => cat.$.domain === 'tribe_events_cat')
    .map(cat => cleanText(cat.$.nicename)) : [];
      // Extract cost, duration, and dates
      const costMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventCost');
      const eventCost = costMeta ? costMeta['wp:meta_value'][0] : 'Unknown';

      const durationMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventDuration');
      const eventDuration = durationMeta ? durationMeta['wp:meta_value'][0] : 'Unknown';

      const startDateMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventStartDate');
      const eventStartDate = startDateMeta ? startDateMeta['wp:meta_value'][0] : 'Unknown';

      const endDateMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventEndDate');
      const eventEndDate = endDateMeta ? endDateMeta['wp:meta_value'][0] : 'Unknown';

      const startDateUTCMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventStartDateUTC');
      const eventStartDateUTC = startDateUTCMeta ? startDateUTCMeta['wp:meta_value'][0] : 'Unknown';

      const recurrenceMeta = event['wp:postmeta']?.find(meta => meta['wp:meta_key'][0] === '_EventRecurrence');
      const recurrence = recurrenceMeta ? parseRecurrence(recurrenceMeta['wp:meta_value'][0]) : {};

      // Group by title and nest the data
      if (!eventGroups[title]) {
        eventGroups[title] = {
          title,
          description,
          contentEncoded,
          imageLink,
          organizer,
          categories,
          occurrences: []
        };
      }

      // Add dates, recurrence, cost, and duration info to occurrences
      eventGroups[title].occurrences.push({
        pubDate: event.pubDate ? event.pubDate[0] : '',
        postDate: event['wp:post_date'] ? event['wp:post_date'][0] : '',
        recurrence,
        eventCost,
        eventDuration,
        eventStartDate,
        eventEndDate,
        eventStartDateUTC
      });
    });

    // Sort by title
    const sortedEventGroups = Object.keys(eventGroups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = eventGroups[key];
        return acc;
      }, {});

    // Write the sorted events into a JSON file
    fs.writeFile(outputFilePath, JSON.stringify(sortedEventGroups, null, 2), (err) => {
      if (err) throw err;
      console.log('Event Info JSON has been saved.');
    });
  });
});