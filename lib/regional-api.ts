// Indonesian Regional API Service
const API_KEY = '14eeb316-c71a-574f-50ca-bed6c638'
const BASE_URL = 'https://api.goapi.io/regional'

export interface Province {
  id: string
  name: string
}

export interface RegionalData {
  status: string
  message: string
  data: Province[]
}

class RegionalAPI {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = API_KEY
    this.baseUrl = BASE_URL
  }

  async getProvinces(): Promise<Province[]> {
    try {
      const response = await fetch(`${this.baseUrl}/provinsi?api_key=${this.apiKey}`, {
        headers: {
          'accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: RegionalData = await response.json()

      if (data.status !== 'success') {
        throw new Error(data.message || 'Failed to fetch provinces')
      }

      return data.data
    } catch (error) {
      console.error('Error fetching provinces:', error)
      // Return fallback data if API fails
      return this.getFallbackProvinces()
    }
  }

  // Fallback major provinces in case API fails
  private getFallbackProvinces(): Province[] {
    return [
      { id: '31', name: 'Daerah Khusus Ibukota Jakarta' },
      { id: '32', name: 'Jawa Barat' },
      { id: '33', name: 'Jawa Tengah' },
      { id: '34', name: 'Daerah Istimewa Yogyakarta' },
      { id: '35', name: 'Jawa Timur' },
      { id: '36', name: 'Banten' },
      { id: '51', name: 'Bali' },
      { id: '61', name: 'Kalimantan Barat' },
      { id: '62', name: 'Kalimantan Tengah' },
      { id: '63', name: 'Kalimantan Selatan' },
      { id: '64', name: 'Kalimantan Timur' },
      { id: '71', name: 'Sulawesi Utara' },
      { id: '72', name: 'Sulawesi Tengah' },
      { id: '73', name: 'Sulawesi Selatan' },
      { id: '81', name: 'Maluku' },
      { id: '91', name: 'Papua' },
      { id: '92', name: 'Papua Barat' },
    ]
  }

  // For future implementation when cities API is available
  async getCities(provinceId: string): Promise<any[]> {
    try {
      // This endpoint needs to be determined from API documentation
      // For now, return empty array
      console.log(`Cities API for province ${provinceId} not yet implemented`)
      return []
    } catch (error) {
      console.error('Error fetching cities:', error)
      return []
    }
  }
}

export const regionalAPI = new RegionalAPI()