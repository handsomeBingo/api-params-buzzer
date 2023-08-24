export default {
  'mapapi/poiinfo': {
    select_lng: 'number@toNumber',
    select_lat: 'number@toNumber'
  },
  'gulfstream/pre-sale/v1/other/pGetIndexInfo': {
    nest: {
      type: 'interface=nestInterface',
      nestInterface: {
        s1: 'number',
        s2: 'string',
        s3: {
          type: 'interface=s3Interface',
          s3Interface: {
            x1: 'boolean',
            x2: 'string',
            x3: {
              type: 'interface=x3Interface',
              x3Interface: {
                ok: 'number',
                not_ok: 'string'
              }
            }
          }
        }
      }
    },
    testArray: 'array[number]'
  }
}
