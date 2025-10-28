// Test script to verify applied date fix
fetch('http://localhost:3000/api/candidates/job_sample_001')
  .then(response => response.json())
  .then(data => {
    console.log('Candidates API Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data && data.data.length > 0) {
      console.log('\n=== Applied Date Analysis ===');
      data.data.forEach((candidate, index) => {
        console.log(`Candidate ${index + 1}:`);
        console.log(`  ID: ${candidate.id}`);
        console.log(`  Created At: ${candidate.created_at}`);
        console.log(`  Has created_at: ${!!candidate.created_at}`);

        // Test the date formatting logic from the table
        if (candidate.created_at) {
          try {
            const date = new Date(candidate.created_at);
            const formattedDate = date.toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            });
            console.log(`  Formatted Date: ${formattedDate}`);
          } catch (error) {
            console.log(`  Date Formatting Error: ${error.message}`);
          }
        } else {
          console.log(`  No created_at field - would use today's date`);
        }
        console.log('');
      });
    } else {
      console.log('No candidates found');
    }
  })
  .catch(error => {
    console.error('Error fetching candidates:', error);
  });