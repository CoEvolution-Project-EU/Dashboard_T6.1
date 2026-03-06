import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  customPalette = ["#fd7f6f", "#7eb0d5", "#b2e061", "#bd7ebe", "#ffb55a", "#ffee65", "#beb9db", "#fdcce5", "#8bd3c7"];
  constructor() { }


  public createCharts_mainDashAlerts(dataset) {

    let chartsData;
    if (dataset[0][0]['key_as_string']) {

      chartsData = {
        "pieData": { data: [], colors: [] }
      }


      chartsData.pieData.data = [
        {
          name: "Low",
          value: 0
        },
        {
          name: "Medium",
          value: 0
        },
        {
          name: "High",
          value: 0
        }, {
          name: "Critical",
          value: 0
        }
      ];

      chartsData.pieData.colors = [
        {
          name: "Low",
          value: "#c3ecdf"
        },
        {
          name: "Medium",
          value: "#ffc200"
        },
        {
          name: "High",
          value: "#ff8313"
        },
        {
          name: "Critical",
          value: "#ff4922"
        }
      ]
      dataset[0].forEach(buck => {

        if (buck.doc_count > 0) {


          buck.severities.buckets.forEach(sev => {
            if (sev.key == 'low') chartsData.pieData.data[0].value += sev.doc_count
            else if (sev.key == 'medium') chartsData.pieData.data[1].value += sev.doc_count
            else if (sev.key == 'high') chartsData.pieData.data[2].value += sev.doc_count
            else chartsData.pieData.data[3].value += sev.doc_count
          })

        }

      })


    } else {


      chartsData = {
        "pieData": { data: [], colors: [] },
        "barData": { data: [], colors: [] },
      }
      //per pie dataset, we need to return both data & color arrays. Both obj arrays should contain the same format ("name", "value")
      //name values must be identical in both arrays. values in data array, contain the actual values. values in color array, contain the color code.

      chartsData.pieData.data = [
        {
          name: "Low",
          value: 0
        },
        {
          name: "Medium",
          value: 0
        },
        {
          name: "High",
          value: 0
        }, {
          name: "Critical",
          value: 0
        }
      ];

      chartsData.pieData.colors = [
        {
          name: "Low",
          value: "#c3ecdf"
        },
        {
          name: "Medium",
          value: "#ffc200"
        },
        {
          name: "High",
          value: "#ff8313"
        },
        {
          name: "Critical",
          value: "#ff4922"
        }
      ]


      dataset[0].forEach(v => {

        if (v._source.signal.rule.severity == 'low') {

          chartsData.pieData.data[0].value++

        } else if (v._source.signal.rule.severity == 'medium') {

          chartsData.pieData.data[1].value++

        } else if (v._source.signal.rule.severity == 'high') {

          chartsData.pieData.data[2].value++
        } else {

          chartsData.pieData.data[3].value++

        }

      })


      let alertTypes = [...new Set(dataset[0].flatMap(v => v._source.signal.rule.name))];

      alertTypes.forEach((type, i) => {

        let typesNum = dataset[0].filter(v => v._source.signal.rule.name == type)

        chartsData.barData.data.push({
          name: type,
          value: typesNum.length
        })

        chartsData.barData.colors.push({
          name: type,
          value: this.customPalette[i]
        })

      })


    }




    return chartsData


  }


  public createStats_mainDashAlerts(dataset) {
    //console.log(data);
    let statsData = {
      "numericData": []
    }
    //let stringStats = [];
    let riskScores = [], riskScoresSum = 0

    dataset[0].forEach(v => {

      riskScores.push(v._source.signal.rule.risk_score)
      riskScoresSum += v._source.signal.rule.risk_score

    })

    riskScores.sort((a, b) => a - b);

    statsData.numericData.push({
      "name": "Risk Scores",
      "lowestValue": riskScores[0],
      "highestValue": riskScores[riskScores.length - 1],
      "avgValue": (riskScoresSum / riskScores.length).toFixed(2)
    })

    return statsData

  }

  ///------- END OF MAINDASHALERTS ------------------------------------///

  public createCharts_mainDashNetflows(dataset) {

    let chartsData;
    //console.log(dataset);

    let topDest = [], topSource = []

    chartsData = {
      "barData": { data: [], colors: [] },
      "barData2": { data: [], colors: [] }
    }

    dataset[0].forEach(buck => {

      if (buck.doc_count > 0) {

        buck.destinationIPs.buckets.forEach(dest => {

          let destIndx = topDest.findIndex(v => v.key == dest.key)

          if (destIndx > -1) {
            topDest[destIndx].doc_count += dest.doc_count
          } else topDest.push(dest)


        })

        buck.sourceIPs.buckets.forEach(source => {

          let sourceIndx = topSource.findIndex(v => v.key == source.key)

          if (sourceIndx > -1) {
            topSource[sourceIndx].doc_count += source.doc_count
          } else topSource.push(source)


        })

      }
    })

    topSource.sort((a, b) => b.doc_count - a.doc_count);
    topDest.sort((a, b) => b.doc_count - a.doc_count);

    for (let i = 0; i < 10; i++) {

      chartsData.barData.data.push({
        name: topSource[i].key,
        value: topSource[i].doc_count
      })

      chartsData.barData.colors.push({
        name: topSource[i].key,
        value: this.customPalette[i]
      })

      chartsData.barData2.data.push({
        name: topDest[i].key,
        value: topDest[i].doc_count
      })

      chartsData.barData2.colors.push({
        name: topDest[i].key,
        value: this.customPalette[i]
      })

    }
    //console.log(topSource,topDest);


    return chartsData

  }

  public createStats_mainDashNetflows(dataset) {
    //console.log(data);

    let statsData = {
      "stringData": [],
      "numericData": []
    }

    let destPorts = [], sourcePorts = [], destIPs = [], sourceIPs = []


    dataset[0].forEach(v => {

      destPorts.push(v._source.destination.port)
      destIPs.push(v._source.destination.ip)
      sourceIPs.push(v._source.source.ip)
      sourcePorts.push(v._source.source.port)

    })

    let destPortsHash = this.getHash(destPorts)
    let destIPsHash = this.getHash(destIPs)
    let sourceIPsHash = this.getHash(sourceIPs)
    let sourcePortsHash = this.getHash(sourcePorts)

    statsData.stringData.push(
      {
        "name": "Source IPs",
        "mostCommon": Object.keys(sourceIPsHash).reduce((a, b) => sourceIPsHash[a] > sourceIPsHash[b] ? a : b),
        "leastCommon": Object.keys(sourceIPsHash).reduce((a, b) => sourceIPsHash[a] < sourceIPsHash[b] ? a : b),
        "uniqueValues": Object.keys(sourceIPsHash).length
      },
      {
        "name": "Source Ports",
        "mostCommon": Object.keys(sourcePortsHash).reduce((a, b) => sourcePortsHash[a] > sourcePortsHash[b] ? a : b),
        "leastCommon": Object.keys(sourcePortsHash).reduce((a, b) => sourcePortsHash[a] < sourcePortsHash[b] ? a : b),
        "uniqueValues": Object.keys(sourcePortsHash).length
      },
      {
        "name": "Destination IPs",
        "mostCommon": Object.keys(destIPsHash).reduce((a, b) => destIPsHash[a] > destIPsHash[b] ? a : b),
        "leastCommon": Object.keys(destIPsHash).reduce((a, b) => destIPsHash[a] < destIPsHash[b] ? a : b),
        "uniqueValues": Object.keys(destIPsHash).length
      },
      {
        "name": "Destination Ports",
        "mostCommon": Object.keys(destPortsHash).reduce((a, b) => destPortsHash[a] > destPortsHash[b] ? a : b),
        "leastCommon": Object.keys(destPortsHash).reduce((a, b) => destPortsHash[a] < destPortsHash[b] ? a : b),
        "uniqueValues": Object.keys(destPortsHash).length
      }
    )

    return statsData

  }

  ///------- END OF MAINDASNETFLOWS ------------------------------------///



  public createStats_globalAlerts(dataset) {
    // console.log(dataset);
    let statsData = {
      "stringData": [],
      "numericData": []

    }
    let events = [], riskScores = [], riskScoresSum = 0

    dataset[0].forEach(v => {

      riskScores.push(v._source.signal.rule.risk_score)
      riskScoresSum += v._source.signal.rule.risk_score

      events.push(v._source.signal.rule.name)

    })

    riskScores.sort((a, b) => a - b);

    statsData.numericData.push({
      "name": "Risk Score",
      "lowestValue": riskScores[0],
      "highestValue": riskScores[riskScores.length - 1],
      "avgValue": (riskScoresSum / riskScores.length).toFixed(2)
    })



    let eventsHash = this.getHash(events)

    //the final schema must be the same for each string parameter (name,mostCommon,leastCommon,uniqueValues)
    statsData.stringData.push(
      {
        "name": "Alert Type",
        "mostCommon": Object.keys(eventsHash).reduce((a, b) => eventsHash[a] > eventsHash[b] ? a : b),
        "leastCommon": Object.keys(eventsHash).reduce((a, b) => eventsHash[a] < eventsHash[b] ? a : b),
        "uniqueValues": Object.keys(eventsHash).length
      })



    //console.log(statsData);

    return statsData


  }

  public createCharts_globalAlerts(dataset) {
    // console.log(dataset);

    let chartsData;

    if (dataset[0][0]['key_as_string']) {

      chartsData = {
        "pieData": { data: [], colors: [] },
        "barData": { data: [], colors: [] },
      }

      chartsData.pieData.data = [
        {
          name: "Low",
          value: 0
        },
        {
          name: "Medium",
          value: 0
        },
        {
          name: "High",
          value: 0
        }, {
          name: "Critical",
          value: 0
        }
      ];

      chartsData.pieData.colors = [
        {
          name: "Low",
          value: "#c3ecdf"
        },
        {
          name: "Medium",
          value: "#ffc200"
        },
        {
          name: "High",
          value: "#ff8313"
        },
        {
          name: "Critical",
          value: "#ff4922"
        }
      ]

      dataset[0].forEach(buck => {

        if (buck.doc_count > 0) {


          buck.severities.buckets.forEach(sev => {
            if (sev.key == 'low') chartsData.pieData.data[0].value += sev.doc_count
            else if (sev.key == 'medium') chartsData.pieData.data[1].value += sev.doc_count
            else if (sev.key == 'high') chartsData.pieData.data[2].value += sev.doc_count
            else chartsData.pieData.data[3].value += sev.doc_count
          })

          buck.hosts.buckets.forEach((host, i) => {

            let indx = chartsData.barData.data.findIndex(v => v.name == host.key)

            if (indx > -1) chartsData.barData.data[indx].value += host.doc_count
            else {

              chartsData.barData.data.push({
                name: host.key,
                value: host.doc_count
              })

              chartsData.barData.colors.push({
                name: host.key,
                value: this.customPalette[i]
              })

            }

          })
        }

      })



    } else {

      chartsData = {
        "stackedData": { data: [], colors: [] }
      }


      let ips = [...new Set(dataset[0].flatMap(v => v._source.host?.name))];
      //console.log(ips);

      ips.forEach((ip, i) => {

        chartsData.stackedData.data.push({
          "name": ip,
          "series": [
            {
              "name": "Low",
              "value": 0
            },
            {
              "name": "Medium",
              "value": 0
            },
            {
              "name": "High",
              "value": 0
            },
            {
              "name": "Critical",
              "value": 0
            }
          ]
        })

        chartsData.stackedData.colors.push(
          {
            "name": "Low",
            "value": "#c3ecdf"
          },
          {
            "name": "Medium",
            "value": "#ffc200"
          },
          {
            "name": "High",
            "value": "#ff8313"
          },
          {
            "name": "Critical",
            "value": "#ff4922"
          }

        )

      })

      dataset[0].forEach(v => {

        if (v._source['kibana.alert.rule.severity'] == 'low') {
          let ipData = chartsData.stackedData.data.find(d => d.name == v._source?.host?.name)

          ipData.series[0].value++;
        } else if (v._source['kibana.alert.rule.severity'] == 'medium') {
          let ipData = chartsData.stackedData.data.find(d => d.name == v._source?.host?.name)
          ipData.series[1].value++;
        } else if (v._source['kibana.alert.rule.severity'] == 'high') {
          let ipData = chartsData.stackedData.data.find(d => d.name == v._source?.host?.name)
          ipData.series[2].value++;
        } else {
          let ipData = chartsData.stackedData.data.find(d => d.name == v._source?.host?.name)
          ipData.series[3].value++;
        }


      })

    }

    return chartsData

  }











  //good2know: this function creates a Map containing all the distinct values of a an array, along with the count of appearance
  private getHash(arr) {

    let hashmap = arr.reduce((acc, val) => {
      acc[val] = (acc[val] || 0) + 1
      return acc
    }, {})

    return hashmap
  }


}
