angular.module('batarang.scope-tree', []).

directive('batScopeTree', ['$compile', '$document', batScopeTreeDirective]);

var indexOf = Array.prototype.indexOf;
var forEach = Array.prototype.forEach;
var slice = Array.prototype.slice;

var $ = angular.element;

function batScopeTreeDirective($compile, $document) {
  return {
    restrict: 'E',
    terminal: true,
    scope: {
      batModel: '=',
    },
    bindToController: {
      searchText: '<',
    },
    controllerAs: '$ctrl',
    require: 'batScopeTree',
    controller: function(){
      // this.$onChanges = function(changes){
      //   if (changes.searchText){
      //    
      //     console.log('changes');
      //     // searchText = changes.searchText.currentValue;
      //     // filter(searchText);
      //   }
      // };
    },
    link: batScopeTreeLink
  };

  function batScopeTreeLink(scope, element, attrs, ctrl) {
    
    var searchText = '';
    
    // Hide a particular element - applied directly to the `span` elements
    var hideClass = 'hide-scope';
    // Applied to the `.children` to indicate they are hidden
    var isHiddenClass = 'is-hidden';
    var isSelectedClass = 'is-selected';
    
    // var sel_visibleChildren = `:scope > span:not(.${hideClass}) ~ .children:not(.${isHiddenClass})`;
    // var sel_visibleChildren = `:scope > .children:not(.${isHiddenClass})`;
    
    var sel_visibleChildren = `.children:not(.${isHiddenClass})`;
    var sel_scopeDescription = `.children > span > .webkit-html-attribute`;
    
    ctrl.$onChanges = function(changes){
      if (changes.searchText){
        searchText = changes.searchText.currentValue;
        filter(searchText);
        
        console.log('changes: ', searchText);
      }
    };
    
    // scope.$id –> DOM node
    var map = {};
    var selectedElt = angular.element();

    // init
    var scopes = scope.batModel;
    hydrate(scopes);

    scope.$on('hydrate', function () {
      refresh();
      hydrate(scopes);
    });
    
    scope.$on('scope:new', function (ev, data) {
      renderScopeElement(data.child, data.parent);
    });

    // when a scope is linked, we can apply the descriptor info
    scope.$on('scope:link', function (ev, data) {
      renderScopeDescriptorElement(data.id, data.descriptor);
    });

    scope.$on('refresh', refresh);
    
    function refresh(){
      map = {};
      element.html('');
    }
    
    function hydrate(scopes){
      if (scopes) {
        Object.keys(scopes).forEach(function (scopeId) {
          var parentId = scopes[scopeId].parent;
          renderScopeElement(scopeId, parentId);
          renderScopeDescriptorElement(scopeId, scopes[scopeId].descriptor);
        });
      }
    }

    function renderScopeElement (id, parentId) {
      if (map[id]) {
        return;
      }
      var elt = map[id] = newBranchElement(id);
      var parentElt = map[parentId] || element;
      
      // wiwo: associate the scope id with the displayed element.
      elt.data('scopeId', id);
      
      elt.children().eq(1).on('click', function () {
        scope.$apply(function () {
          inspectScope(id);
          selectItem(elt);
        });
      });

      parentElt.append(elt);
    }
    
    function renderScopeDescriptorElement (id, descriptor) {
      var elt = map[id];
      if (!elt) {
        return;
      }
      elt.children().eq(1).children().eq(1).html(descriptor);
      
      // Pass the `.webkit-html-attribute` element
      filterEl(elt.children().eq(1).children()[1], searchText);
    }
    
    function inspectScope(id){
      scope.$emit('inspected-scope:change', {
        id: id
      });
    }
    
    function selectItem(elt){
      selectedElt.removeClass(isSelectedClass);
      selectedElt.children().eq(0).removeClass('selected');
      selectedElt.children().eq(1).removeClass('selected');

      selectedElt = elt;

      selectedElt.addClass(isSelectedClass);
      selectedElt.children().eq(0).addClass('selected');
      selectedElt.children().eq(1).addClass('selected');
    }

    // TODO: also destroy elements corresponding to descendant scopes
    scope.$on('scope:destroy', function (ev, data) {
      var id = data.id;
      var elt = map[id];
      if (elt) {
        elt.remove();
      }
      delete map[id];
    });
    
    
    $document.on('keydown', keyHandler);
    scope.$on('$destroy', function(){
      $document.off('keydown', keyHandler);
    });
    
    function keyHandler(event){
      var keyCode = event.keyCode;
      if (!selectedElt.length){
        keyCode = 36; // Equivalent to pressing "home" - select the first item
      }
      
      var elt = selectedElt[0];
      var eltParent = selectedElt[0];
      
      var nextEl;
      switch (keyCode){
          case 35: // end
            nextEl = slice.call(getVisibleChildren(element[0]), -1)[0];
          break;
          
          case 36: // home
            nextEl = getVisibleChildren(element[0])[0];
          break;
        
          case 38: // up
            event.preventDefault();
            eltParent = elt.parentElement;
            
            nextEl = findNext(element[0], elt, -1);
            break;
            
          case 40: // down
            event.preventDefault();
            direction = 1;
            
            nextEl = findNext(element[0], elt, 1);
            break;
      }
      
      nextEl = $(nextEl);
      if (nextEl.length && nextEl.hasClass('children')){
        // wiwo: associate the scope id with the displayed element.
        let scopeId = nextEl.data('scopeId');
        
        scope.$apply(function () {
          inspectScope(scopeId);
          selectItem(nextEl);
          nextEl[0].children[0].scrollIntoViewIfNeeded(false);
        });
      }
    }
    
    function getVisibleChildren(eltParent){
      return eltParent.querySelectorAll('.children:not(.is-hidden)');
    }
    
    
    function findNext(eltParent, selectedElt, direction){
      var children = getVisibleChildren(eltParent);
      
      var index = 0;
      if (selectedElt){
        var curIndex = indexOf.call(children, selectedElt);
        index = curIndex + direction;
      }
      
      index = Math.min(Math.max(0, index), children.length - 1);
      var result = children[index];
      return result;
    }
    
    
    function getLast(el){
      var result = el;
      
      var children = el.querySelectorAll(sel_visibleChildren);
      if (children.length){
        result = getLast(children[children.length - 1]);
      }
      return result;
    }
    
    
    function filter(searchText){
      // Start at the top of the tree
      var el = element[0];
      
      // Pass the `.webkit-html-attribute` element for searching
      var searchEls = el.querySelectorAll(sel_scopeDescription);
      forEach.call(searchEls, (el) => {
        filterEl(el, searchText);
      });
    }
    
    
    /*
    Search for text in a scope node where the given `el` is `span.webkit-html-attribute`
    and the parent `span.scope-descriptor` element is shown/hidden.
    
    span.scope-descriptor <-- this is `el.parentElement`
      span.webkit-html-tag
      span.webkit-html-attribute    <-- this is given as `el` parameter
      span.webkit-html-tag
    */
    function filterEl(el, searchText){
      var $el = $(el);
      
      var content = $el.data('prevContent') || el.textContent;
      var results = searchText != '' ? content.split(searchText) : [];
      
      if (results.length > 1){
        // Split search and add highlights
        var newContent = results.join(`<span class="search-highlight">${searchText}</span>`);;
        $el.html(newContent);
      }
      
      if (searchText == '' || results.length > 1){
        // show
        el.parentElement.classList.remove(hideClass); // span
        el.parentElement.parentElement.classList.remove(isHiddenClass); // .children (that contains span)
        
        $el.data('prevContent', content);
      } else {
        // hide
        el.parentElement.classList.add(hideClass);
        el.parentElement.parentElement.classList.add(isHiddenClass);
      }
      
      if ((searchText == '' || results.length <= 1) && $el.data('prevContent')){
        // Restore original content
        $el.text($el.data('prevContent'));
        $el.data('prevContent', null);
      }
    }
    
    
    
  }
}


// TODO: tabindex
function newBranchElement(descriptor) {
  return angular.element([
    '<ol class="children expanded">',
      '<div class="selection"></div>',
      '<span class="scope-descriptor">',
        '<span class="webkit-html-tag">&lt;</span>',
        '<span class="webkit-html-attribute">Scope #', descriptor, '</span>',
        '<span class="webkit-html-tag">&gt;</span>',
      '</span>',
    '</ol>'].join(''));
}
