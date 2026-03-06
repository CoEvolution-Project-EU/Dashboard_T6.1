import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DetailsService {

  constructor() { }

  public createData_mainDashAlerts(data) {

    let tableData = [];

    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        tableData.push({
          severity: v._source['kibana.alert.rule.severity'],
          alert: v._source['kibana.alert.rule.name'],
          risk_score: v._source['kibana.alert.rule.risk_score'],
          timestamp: new Date(v.sort[0]),
          message: v._source['kibana.alert.reason']
        })
      })

    } else {

      let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

      data[0].aggregations.clusters.buckets.forEach((v, i) => {

        if (v.doc_count > 0) {

          let sevs = v.severities.buckets.map(s => s.key).sort()

          tableData.push({
            alerts: v.doc_count,
            severities: sevs,
            start: new Date(v.key),
            end: new Date(v.key + interval),
          })

        }

      })

    }

    // console.log(tableData);

    return tableData;

  }

  public createData_mainDashNetflows(data) {
    //console.log(data);

    let tableData = [];
    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        tableData.push({

          source_ip: v._source.source.ip,
          source_port: v._source.source.port,
          destination_ip: v._source.destination.ip,
          destination_port: v._source.destination.port,
          packets: v._source.network.packets,
          bytes: v._source.network.bytes,
          timestamp: new Date(v.sort[0]),
        })
      })

    } else {

      let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

      data[0].aggregations.clusters.buckets.forEach((v, i) => {

        if (v.doc_count > 0) {

          tableData.push({
            netflows: v.doc_count,
            packets_min: v.packets.min,
            packets_avg: v.packets.avg.toFixed(2),
            packets_max: v.packets.max,
            packets_sum: v.packets.sum,
            start: new Date(v.key),
            end: new Date(v.key + interval),
          })

        }

      })



    }

    //console.log(tableData);


    return tableData;

  }


  public createData_globalAlerts(data) {

    let tableData = [];

    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        let host = '-'
        if (v._source.host && v._source.host.name) host = v._source.host.name


        tableData.push({
          host: host,
          severity: v._source['kibana.alert.rule.severity'],
          alert: v._source['kibana.alert.rule.name'],
          risk_score: v._source['kibana.alert.rule.risk_score'],
          timestamp: new Date(v.sort[0]),
          message: v._source['kibana.alert.reason']
        })

      })

    } else {

      let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

      data[0].aggregations.clusters.buckets.forEach((v, i) => {

        if (v.doc_count > 0) {

          let sevs = v.severities.buckets.map(s => s.key).sort()
          let hosts = v.hosts.buckets.map(s => s.key).sort()


          tableData.push({
            alerts: v.doc_count,
            hosts: hosts,
            severities: sevs,
            start: new Date(v.key),
            end: new Date(v.key + interval),
          })

        }

      })

    }

    return tableData;

  }
  public createColumns_globalAlerts(data) {
    let columns = []
    if (!data[0].hits) {

      columns = [
        "hosts",
        "alerts",
        "severities",
        "start",
        "end",
      ]

    } else {

      columns = [
        "host",
        "alert",
        "severity",
        "risk_score",
        "message",
        "timestamp"
      ]

    }

    return columns
  }


  public createData_ramAlerts(data) {

    let tableData = [];

    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        tableData.push({
          host: v._source.target_id,
          spike: v._source.spike,
          alert: 'Abnormal RAM Detection',
          mean: v._source.mean,
          timestamp: new Date(v._source['timestamp_id']),
          memory_usage: v._source.memory_usage.toFixed(4),
          stdev: v._source.stdev.toFixed(4)

        })

      })

    }
    // else {

    //   let interval = data[0].aggregations.clusters.buckets[1].key - data[0].aggregations.clusters.buckets[0].key;

    //   data[0].aggregations.clusters.buckets.forEach((v, i) => {

    //     if (v.doc_count > 0) {

    //       let sevs = v.severities.buckets.map(s => s.key).sort()
    //       let hosts = v.hosts.buckets.map(s => s.key).sort()


    //       tableData.push({
    //         alerts: v.doc_count,
    //         hosts: hosts,
    //         severities: sevs,
    //         start: new Date(v.key),
    //         end: new Date(v.key + interval),
    //       })

    //     }

    //   })

    // }

    return tableData;

  }
  public createColumns_ramAlerts(data) {
    let columns = []
    // if (!data[0].hits) {

    columns = [
      "host",
      "alert",
      "spike",
      "mean",
      "memory_usage",
      "stdev",
      "timestamp",

    ]

    // }
    // else {

    //   columns = [
    //     "host",
    //     "alert",
    //     "severity",
    //     "risk_score",
    //     "message",
    //     "timestamp"
    //   ]

    // }

    return columns
  }


  public createData_cpuAlerts(data) {

    let tableData = [];

    if (data[0].hits) {

      data[0].hits.hits.forEach((v, i) => {

        tableData.push({
          host: v._source.target_id,
          spike: v._source.spike,
          alert: "CPU spike detection",
          cpu_usage: v._source.host_cpu_usage,
          stdev: v._source.stdev,
          timestamp: new Date(v._source['timestamp_id']),
        })

      })

    }

    return tableData;

  }
  public createColumns_cpuAlerts(data) {
    let columns = []

    columns = [
      "host",
      "alert",
      "spike",
      "cpu_usage",
      "stdev",
      "timestamp",
    ]

    return columns
  }


  public createData_securityDetails(data) {

    let tableData = [];

    if (data[0].securityDetails.hits) {

      data[0].securityDetails.hits.hits.forEach((v, i) => {
        tableData.push({
          client_ip: v._source['ip'],
          beat: v._source.agent['type'],
          destination_bytes: this.formatBytes(v._source.destination['bytes']),
          destination_packets: v._source.destination['packets'],
          source_bytes: this.formatBytes(v._source.source['bytes']),
          source_packets: v._source.source['packets'],
          timestamp: new Date(v._source['@timestamp']),
        })

      })

    }

    return tableData;

  }
  public createColumns_securityDetails(data) {
    let columns = []

    columns = [
      // "host",
      "client_ip",
      "source_bytes",
      "source_packets",
      "destination_bytes",
      "destination_packets",
      "timestamp",
      "beat"
    ]

    return columns
  }


  public createData_processDetails(data) {

    let tableData = [];

    if (data[0].processDetails.hits) {

      data[0].processDetails.hits.hits.forEach((v, i) => {

        tableData.push({
          user_name: v.fields['user.name'],
          process: v.fields['process.name'],
          // host: v.fields['host.name'],
          action: v.fields['event.action'],
          process_id: v.fields['process.pid'],
          timestamp: new Date(v.fields['@timestamp']),
        })

      })

    }

    return tableData;

  }
  public createColumns_processDetails(data) {
    let columns = []

    columns = [
      "user_name", "process",
      // "host", 
      "action", "process_id", "timestamp"
    ]

    return columns
  }


  public createData_uncommonDetails(data) {

    let tableData = [];

    if (data[0].uncommonDetails.hits) {

      data[0].uncommonDetails.hits.hits.forEach((v, i) => {
        tableData.push({
          user_name: v._source.user['name'],
          process: v._source.process['name'],
          process_args: v._source.process['command_line'],
          // host: v._source.host['hostname'],
          timestamp: new Date(v._source['@timestamp']),
        })

      })

    }

    return tableData;

  }
  public createColumns_uncommonDetails(data) {
    let columns = []

    columns = [
      "user_name", "process", "process_args",
      // "host", 
      "timestamp"
    ]

    return columns
  }


  public createData_loginDetails(data) {

    let tableData = [];

    if (data[0].loginDetails.hits) {

      data[0].loginDetails.hits.hits.forEach((v, i) => {
        tableData.push({
          user_name: v._source.user['name'],
          // host: v._source.host['hostname'],
          outcome: v._source.event['outcome'],
          action: v._source.event['action'],
          timestamp: new Date(v._source['@timestamp']),
        })

      })

    }

    return tableData;

  }
  public createColumns_loginDetails(data) {
    let columns = []

    columns = [
      "user_name",
      // "host", 
      "outcome", "action", "timestamp"
    ]

    return columns
  }


  public createData_fileintDetails(data) {

    let tableData = [];

    if (data[0].fileintDetails.hits) {

      data[0].fileintDetails.hits.hits.forEach((v, i) => {
        let path = '-'
        let owner = '-'
        let type = '-'
        let action = '-'

        if (v._source.file['path']) path = v._source.file['path']
        if (v._source.file['owner']) owner = v._source.file['owner']
        if (v._source.file['type']) type = v._source.file['type']
        if (v._source.file['action']) action = v._source.file['action']

        tableData.push({
          file_path: path,
          file_owner: owner,
          file_type: type,
          action: action,
          timestamp: new Date(v._source['@timestamp']),
        })

      })

    }

    return tableData;

  }
  public createColumns_fileintDetails(data) {
    let columns = []

    columns = [
      // "host",
      "file_owner", "file_path", "file_type", "action", "timestamp"
    ]

    return columns
  }


  public createData_failedSSHDetails(data) {

    let tableData = [];

    if (data[0].failedSSHDetails.hits) {

      data[0].failedSSHDetails.hits.hits.forEach((v, i) => {
        let result = '-'
        let event = '-'
        let method = '-'
        let city_name = '-'
        let country_name = '-'
        let ip = '-'
        let os = '-'
        let user = '-'

        if (v._source.event.outcome) result = v._source.event.outcome
        if (v._source.event.action) event = v._source.event.action
        if (v._source.system.auth.ssh.method) method = v._source.system.auth.ssh.method
        if (v._source.source.geo && v._source.source.geo.city_name) city_name = v._source.source.geo.city_name
        if (v._source.source.geo && v._source.source.geo.country_name) country_name = v._source.source.geo.country_name
        if (v._source.source.ip) ip = v._source.source.ip
        if (v._source.host.os) os = v._source.host.os.name
        if (v._source.related.user) user = v._source.related.user

        tableData.push({
          result: result,
          event: event,
          method: method,
          city_name: city_name,
          country_name: country_name,
          ip: ip,
          os: os,
          timestamp: new Date(v._source['@timestamp']),
          user: user
        })

      })

    }

    return tableData;

  }
  public createColumns_failedSSHDetails(data) {
    let columns = []

    columns = [
      "result",
      "event",
      "method",
      "city_name",
      "country_name",
      "ip",
      "os",
      "timestamp"
    ]

    return columns
  }


  public createColumns_mainDashAlerts(data) {
    let columns = [];

    if (!data[0].hits) {

      columns = [
        "alerts",
        "severities",
        "start",
        "end",
      ]


    } else {

      columns = [
        "alert",
        "severity",
        "risk_score",
        "message",
        "timestamp"
      ]
    }


    return columns;


  }
  public createColumns_mainDashNetflows(data) {
    let columns = [];

    if (!data[0].hits) {

      columns = [
        "netflows",
        "packets_min",
        "packets_avg",
        "packets_max",
        "packets_sum",
        "start",
        "end",
      ]


    } else {

      columns = [
        "source_ip",
        "source_port",
        "destination_ip",
        "destination_port",
        "packets",
        "bytes",
        "timestamp"
      ]
    }

    return columns;


  }


  public createData_USBActivity(data) {

    let tableData = [];

    if (data[0].USBActivity.hits) {

      data[0].USBActivity.hits.hits.forEach((v, i) => {

        tableData.push({
          timestamp: new Date(v.fields['@timestamp']),
          task: v.fields['winlog.task'],
          platform: v.fields['host.os.platform']
        })

      })

    }


    return tableData;

  }
  public createColumns_USBActivity(data) {
    let columns = []

    columns = [
      "platform", "task", "timestamp"
    ]

    return columns
  }

  formatBytes(bytes) {
    var marker = 1024;
    var decimal = 2;
    var kiloBytes = marker;
    var megaBytes = marker * marker;
    var gigaBytes = marker * marker * marker;

    // return bytes if less than a KB
    if (bytes < kiloBytes) return bytes + " B";
    // return KB if less than a MB
    else if (bytes < megaBytes) return (bytes / kiloBytes).toFixed(decimal) + " KB";
    // return MB if less than a GB
    else if (bytes < gigaBytes) return (bytes / megaBytes).toFixed(decimal) + " MB";
    // return GB if less than a TB
    else return (bytes / gigaBytes).toFixed(decimal) + " GB";
  }
}
