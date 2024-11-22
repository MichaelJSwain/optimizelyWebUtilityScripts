const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: 'Bearer 2:Y9EOz6drYcTtjrz76bdPESAgDCdS8hydrV5z6MCL_G69yoJc0iBQ'
    },
    body: JSON.stringify({
      audience_conditions: 'everyone',
      metrics: [
        {
          aggregator: 'sum',
          field: 'revenue',
          scope: 'visitor',
          winning_direction: 'increasing'
        }
      ],
      schedule: {time_zone: 'UTC'},
      type: 'a/b',
      variations: [
        {name: 'control', weight: 5000, actions: [{page_id: 4696157557882880}]},
        {
          weight: 5000,
          name: 'variant',
          actions: [
            {
              page_id: 4696157557882880,
              changes: [{type: 'custom_code', value: 'console.log("custom code v1")'}]
            }
          ]
        }
      ],
      page_ids: [4696157557882880],
      project_id: 14193350179,
      traffic_allocation: 10000,
      name: 'empty custom code test'
    })
  };
  
  fetch('https://api.optimizely.com/v2/experiments', options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch(err => console.error(err));