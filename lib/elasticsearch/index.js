import Body from './body';
import SearchQuery from '../types/SearchQuery';
/**
 * Create a query elasticsearch request body based on a `SearchQuery`
 * @return {Object} Elasticsearch request body
 */
export async function buildQueryBodyFromSearchQuery({ config, queryChain, searchQuery, customFilters }) {
    const filter = new Body({ config, queryChain, searchQuery, customFilters });
    return filter.buildQueryBodyFromSearchQuery().build();
}
/**
 * Apply a search-text string to query (for string-based searches in, like in VSF search-box)-
 * This will create a set of filters based on your attributes set in API's search configs.
 * @return {Object} `bodybuilder` query chain
 */
export function applySearchQuery({ config, queryText, queryChain }) {
    const searchQuery = new SearchQuery({ _searchText: queryText });
    return new Body({ config, searchQuery, queryChain }).buildQueryBodyFromSearchQuery().getQueryChain();
}
/**
 * Apply simple, single-lined sort arguments to query
 * @return {Object} `bodybuilder` query chain
 */
export function applySort({ sort, queryChain }) {
    if (sort) {
        Object.keys(sort).forEach((key) => {
            queryChain.sort(key, sort[key]);
        });
    }
    return queryChain;
}
/**
 * Build a elasticsearch request-body from unified query object (as known from `storefront-api`) - eg: `{ "type_id": { "eq": "configurable "} }`
 * @return {Object} Elasticsearch request body
 */
export async function buildQueryBodyFromFilterObject({ config, queryChain, filter, postFilter, availableFilter, sort, search = '' }) {
    function processNestedFieldFilter(attribute, value) {
        let processedFilter = {
            'attribute': attribute,
            'value': value
        };
        let filterAttributeKeys = Object.keys(value);
        for (let filterAttributeKey of filterAttributeKeys) {
            if (value[filterAttributeKey] && !Array.isArray(value[filterAttributeKey]) && typeof value[filterAttributeKey] === 'object') {
                processedFilter = processNestedFieldFilter(attribute + '.' + filterAttributeKey, value[filterAttributeKey]);
            }
        }
        return processedFilter;
    }
    const appliedFilters = [];
    if (filter) {
        for (var attribute in postFilter) {
            let processedFilter = processNestedFieldFilter(attribute, filter[attribute]);
            let appliedAttributeValue = processedFilter['value'];
            const scope = appliedAttributeValue.scope || 'default';
            delete appliedAttributeValue.scope;
            appliedFilters.push({
                attribute: processedFilter['attribute'],
                value: appliedAttributeValue,
                scope: scope
            });
        }
    }
    const appliedPostFilters = [];
    if (postFilter) {
        for (var attribute in postFilter) {
            let processedFilter = processNestedFieldFilter(attribute, postFilter[attribute]);
            let appliedAttributeValue = processedFilter['value'];
            const scope = 'default';
            delete appliedAttributeValue.scope;
            appliedPostFilters.push({
                attribute: processedFilter['attribute'],
                value: appliedAttributeValue,
                scope: scope
            });
        }
    }
    const availableFilters = [];
    if (availableFilter) {
        for (var attribute in availableFilter) {
            const scope = 'default';
            availableFilters.push({
                field: attribute,
                scope: scope,
                options: {}
            });
        }
    }
    return buildQueryBodyFromSearchQuery({
        config,
        queryChain,
        searchQuery: new SearchQuery({
            _appliedFilters: appliedFilters,
            _appliedPostFilters: appliedPostFilters,
            _availableFilters: availableFilters,
            _appliedSort: sort,
            _searchText: search
        })
    });
}
//# sourceMappingURL=index.js.map