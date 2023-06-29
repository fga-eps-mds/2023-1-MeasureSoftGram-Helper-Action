import axios, { AxiosInstance } from 'axios';

import { Info } from './utils';

export interface MeasuresResponseAPI {
  paging: {
      pageIndex: number
      pageSize: number
      total: number
  },
  baseComponent : {
      id: string
      key: string
      name: string
      qualifier: string
      measures: [unknown]
  },
  components: {
      id: string
      key: string
      name: string
      qualifier: string
      path: string
      language: string
      measures: [unknown]
  },
}

export default class Sonarqube {
  private http: AxiosInstance
  public host: string
  private token: string
  public project: {
    sonarProjectKey: string
  }
  public sonarMetrics = [
      'files',
      'functions',
      'complexity',
      'comment_lines_density',
      'duplicated_lines_density',
      'coverage',
      'ncloc',
      'tests',
      'test_errors',
      'test_failures',
      'test_execution_time',
      'security_rating',
      'test_success_density',
      'reliability_rating',
  ]

  constructor(info: Info) {
    this.host = info.host || 'https://sonarcloud.io'
    this.token = info.token
    this.project = info.project

    console.log(`SonarQube host: ${this.host}`)
    console.log(`SonarQube project: ${this.project.sonarProjectKey}`)
      // print url 
      console.log(`SonarQube url: ${this.host}/api/measures/component_tree?component=${this.project.sonarProjectKey}&metricKeys=${this.sonarMetrics.join(',')}&ps=${500}`)


    this.http = axios.create({
        baseURL: this.host,
        timeout: 10000,
    })
  }

  public getMeasures = async ({
    pageSize
  }: {
      pageSize: number
    }): Promise<MeasuresResponseAPI> => {
    try {

      const response = await this.http.get<MeasuresResponseAPI>(
        `/api/measures/component_tree?component=${this.project.sonarProjectKey}&metricKeys=${this.sonarMetrics.join(',')}&ps=${pageSize}`
      )

      if (response.status !== 200 || !response.data) {
        throw new Error(
          'Error getting project measures from SonarQube. Please make sure you provided the host and token inputs.'
        )
      }

      return response.data        
    } catch (err) {
      throw new Error(
        'Error getting project measures from SonarQube. Please make sure you provided the host and token inputs.'
      )
    }
  }
}