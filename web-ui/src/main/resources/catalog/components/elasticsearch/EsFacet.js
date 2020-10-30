/*
 * Copyright (C) 2001-2016 Food and Agriculture Organization of the
 * United Nations (FAO-UN), United Nations World Food Programme (WFP)
 * and United Nations Environment Programme (UNEP)
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or (at
 * your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA 02110-1301, USA
 *
 * Contact: Jeroen Ticheler - FAO - Viale delle Terme di Caracalla 2,
 * Rome - Italy. email: geonetwork@osgeo.org
 */

(function() {
  goog.provide('gn_es_facet');

  var module = angular.module('gn_es_facet', []);

  var DEFAULT_SIZE = 10;

  module.service('gnESFacet', ['gnGlobalSettings', 'gnFacetTree',
    function(gnGlobalSettings, gnFacetTree) {

    var defaultSource = {
      includes: [
      'uuid',
      'id',
      'creat*',
      'group*',
      'logo',
      'category',
      'topic*',
      'inspire*',
      'resource*',
      'draft',
      'overview.*',
      'owner*',
      'link*',
      'image*',
      'status*',
      'rating',
      'tag*',
      'geom',
      'contact*',
      '*Org*',
      'hasBoundingPolygon',
      'isTemplate',
      'valid',
      'isHarvested',
      'dateStamp',
      'documentStandard',
      'codelist_status*',
      'recordLink'
    ]};
    this.configs = {
      search: {
        facets: gnGlobalSettings.gnCfg.mods.search.facetConfig,
        source: defaultSource,
        track_total_hits: true
      },
      home: {
        facets: gnGlobalSettings.gnCfg.mods.home.facetConfig,
        source: {
          includes: [
            'id',
            'uuid',
            'creat*',
            'topicCat',
            'inspire*',
            'overview.*',
            'resource*',
            'image*',
            'tag*'
          ]
        }
      },
      editor: {
        facets: gnGlobalSettings.gnCfg.mods.editor.facetConfig,
        source: {
          includes: [
            'id',
            'uuid',
            'creat*',
            'group*',
            'resource*',
            'draft',
            'owner*',
            'recordOwner',
            'status*',
            'tag*',
            'isTemplate',
            'valid',
            'isHarvested',
            'dateStamp',
            'documentStandard',
            '*inspire*'
          ]
        },
        track_total_hits: true
      },
      directory: {
        facets: gnGlobalSettings.gnCfg.mods.editor.facetConfig,
          source: {
          includes: [
            'id',
            'uuid',
            'creat*',
            'group*',
            'resource*',
            'owner*',
            'recordOwner',
            'status*',
            'isTemplate',
            'valid',
            'isHarvested',
            'changeDate',
            'documentStandard'
          ]
        },
        track_total_hits: true
      },
      simplelist: {
        facets: {},
        source: {
          includes: [
            'id',
            'uuid',
            'overview.*',
            'resource*'
          ]
        }
      },
      recordsWithErrors: {
        facets: {
          "indexingErrorMsg": {
            "terms": {
              "field": "indexingErrorMsg.keyword",
              "size": 10
            }
          }
        },
        source: {
          includes: [
            'id',
            'uuid',
            'resource*',
            'index*'
          ]
        },
        track_total_hits: true
      }
    };

    this.addFacets = function(esParams, type) {
      var esFacet = this, aggs = typeof type === 'string' ?
        angular.copy(this.configs[type].facets, {}) :
        type;
      angular.forEach(aggs, function(facet) {
        esFacet.removeInternalFacetConfig(facet);
      });
      esParams.aggregations = aggs;
    };

    this.removeInternalFacetConfig = function (facet) {
      delete facet.userHasRole;
      delete facet.collapsed;
      return facet;
    };

    this.addSourceConfiguration = function(esParams, type) {
      if (type === undefined) {
        type = 'simplelist';
      }
      var source = typeof type === 'string' ? this.configs[type].source : type;
      esParams._source = source;


      // By default limit to 10000.
      // Set to true will be a bit slower
      // See https://www.elastic.co/guide/en/elasticsearch/reference/current/search-request-body.html#request-body-search-track-total-hits
      if (this.configs[type].track_total_hits) {
        esParams.track_total_hits = this.configs[type].track_total_hits;
      }
    };

    this.getUIModel = function(response, request, configId) {
      var listModel;
      listModel = this.createFacetModel(request.aggregations, response.data.aggregations, undefined, undefined, configId)
      response.data.facets = listModel;
      return response.data;
    };

    this.createFacetModel = function(reqAggs, respAggs, isNested, path, configId) {
      var listModel = [];
      if (respAggs == undefined) {
        return;
      }
      for (var fieldId in reqAggs) {
        var respAgg = respAggs[fieldId];
        var reqAgg = reqAggs[fieldId];

        function facetHasProperty(configId, fieldId, propertyKey) {
          return configId && this.configs[configId].facets
            && this.configs[configId].facets[fieldId]
            && this.configs[configId].facets[fieldId][propertyKey];
        }
        var facetModel = {
          key: fieldId,
          userHasRole: configId && this.configs[configId].facets
            && this.configs[configId].facets[fieldId]
            && this.configs[configId].facets[fieldId].userHasRole,
          collapsed: configId && this.configs[configId].facets
            && this.configs[configId].facets[fieldId]
            && this.configs[configId].facets[fieldId].collapsed,
          items: [],
          path: (path || []).concat([fieldId])
        };

        if (reqAgg.hasOwnProperty('terms')) {

          if(fieldId.endsWith('_tree')) {
            facetModel.type = 'tree';
            var tree = gnFacetTree.getTree(respAgg.buckets);
            facetModel.items = tree.items;
          } else {
            facetModel.type = 'terms';
            facetModel.size = reqAgg.terms.size;
            facetModel.more = respAgg.sum_other_doc_count > 0;
            facetModel.includeFilter = reqAgg.terms.include !== undefined;
            facetModel.excludeFilter = reqAgg.terms.exclude !== undefined;
            var esFacet = this;
            respAgg.buckets.forEach(function (bucket) {
              if (angular.isDefined(bucket.key)) {
                var key = (bucket.key_as_string || bucket.key),
                    itemPath = facetModel.path.concat([key + '']);
                var facet = {
                  value: key,
                  meta: bucket.meta,
                  count: bucket.doc_count,
                  path: itemPath
                };
                // nesting
                if(isNested) {
                  facet.isNested = true
                }
                if(reqAgg.hasOwnProperty('aggs')) {
                  var nestAggs = {}
                  for (var indexKey in reqAgg.aggs) {
                    nestAggs[indexKey] = bucket[indexKey]
                  }
                  facet.aggs = esFacet.createFacetModel(reqAgg.aggs, nestAggs, true, itemPath)
                }
                facetModel.items.push(facet);
              }
            });

          }
        } else if (reqAgg.hasOwnProperty('date_histogram') || reqAgg.hasOwnProperty('auto_date_histogram')) {
          facetModel.type = 'dates';
          facetModel.dates = [];
          facetModel.datesCount = [];

          var dateInterval;
          var dayDuration = 1000 * 60 * 60 * 24;
          var intervals = {
            year: dayDuration * 365,
            month: dayDuration * 30,
            week: dayDuration * 7,
            day: dayDuration,
            s: 1000,
            m: 1000 * 60,
            h: 1000 * 60 * 24,
            d: dayDuration,
            M: dayDuration * 30,
            y: dayDuration * 365
          };
          if (reqAgg.hasOwnProperty('date_histogram')) {
            dateInterval = intervals[reqAgg.date_histogram.calendar_interval];
          } else {
            var interval = respAgg.interval;
            var unit = interval.substring(interval.length - 1, interval.length);
            dateInterval = parseInt(interval.substring(0, interval.length - 1)) * intervals[unit];
          }

          for (var p in respAgg.buckets) {
            if (!respAgg.buckets[p].key || !respAgg.buckets[p].doc_count) {
              continue;
            }
            facetModel.dates.push(new Date(respAgg.buckets[p].key));
            facetModel.datesCount.push({
              begin: new Date(respAgg.buckets[p].key),
              end: new Date(respAgg.buckets[p].key + dateInterval),
              count: respAgg.buckets[p].doc_count
            });
          }

          if (respAgg.buckets.length > 1) {
            facetModel.from = moment(respAgg.buckets[0].key).format('DD-MM-YYYY');
            facetModel.to = moment(respAgg.buckets[respAgg.buckets.length - 1].key + dateInterval).format('DD-MM-YYYY');
          }

        } else if (reqAgg.hasOwnProperty('filters')) {
          facetModel.type = 'filters';
          facetModel.size = DEFAULT_SIZE;
          for (var p in respAgg.buckets) {
            facetModel.items.push({
              value: p,
              path: [fieldId, p],
              query_string: reqAgg.filters.filters[p],
              count: respAgg.buckets[p].doc_count
            });
          }
        } else if (reqAgg.hasOwnProperty('histogram')) {
          // https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-bucket-histogram-aggregation.html
          facetModel.type = 'histogram';
          facetModel.size = respAgg.buckets.size;
          if (angular.isDefined(reqAgg.histogram.keyed)) {
            var entries = Object.entries(respAgg.buckets);
            for (var p = 0; p < entries.length; p++) {
              var lowerBound = entries[p][1].key,
                  onlyOneBucket = entries.length === 1,
                  upperBound = onlyOneBucket ?
                    lowerBound + Number(reqAgg.histogram.interval)
                    : (entries[p + 1] ? entries[p + 1][1].key : '*');

              facetModel.items.push({
                value: lowerBound + '-' + upperBound,
                path: [fieldId, lowerBound],
                query_string: {query_string: {query: '' + reqAgg.histogram.field + ':'
                  + '[' + lowerBound + ' TO ' + upperBound + '}'}},
                count: entries[p][1].doc_count
              });
            }
          } else {
            console.warn('Facet configuration error. Histogram are only supported with keyed mode.',
              "eg. creationYearForResource: {histogram: { " +
              "field: 'creationYearForResource'," +
              "interval: 5," +
              "keyed: true," +
              "min_doc_count: 1}}");
          }
        }
        listModel.push(facetModel);
      }
      return listModel;
    }

  }]);
})();
