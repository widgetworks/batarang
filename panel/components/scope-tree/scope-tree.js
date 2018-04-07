angular.module('batarang.scope-tree', []).

directive('batScopeTree', ['$compile', '$document', batScopeTreeDirective]);

function batScopeTreeDirective($compile, $document) {
  return {
    restrict: 'E',
    terminal: true,
    scope: {
      batModel: '='
    },
    link: batScopeTreeLink
  };

  function batScopeTreeLink(scope, element, attrs) {
    // scope.$id –> DOM node
    var map = {};
    var selectedElt = angular.element();

    // init
    var scopes = scope.batModel;
    if (scopes) {
      Object.keys(scopes).forEach(function (scopeId) {
        var parentId = scopes[scopeId].parent;
        renderScopeElement(scopeId, parentId);
        renderScopeDescriptorElement(scopeId, scopes[scopeId].descriptor);
      });
    }

    scope.$on('scope:new', function (ev, data) {
      renderScopeElement(data.child, data.parent);
    });

    // when a scope is linked, we can apply the descriptor info
    scope.$on('scope:link', function (ev, data) {
      renderScopeDescriptorElement(data.id, data.descriptor);
    });

    scope.$on('refresh', function () {
      map = {};
      element.html('');
    });

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
    }
    
    function inspectScope(id){
      scope.$emit('inspected-scope:change', {
        id: id
      });
    }
    
    function selectItem(elt){
      selectedElt.children().eq(0).removeClass('selected');
      selectedElt.children().eq(1).removeClass('selected');

      selectedElt = elt;

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
    
    
    var $ = angular.element;
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
            nextEl = getLast(element[0]);
          break;
          
          case 36: // home
            nextEl = findDown(element[0], elt, 1);
          break;
          
          case 37: // left
            event.preventDefault();
            nextEl = elt.parentElement;
          break;
        
          case 38: // up
            event.preventDefault();
            eltParent = elt.parentElement;
            
            nextEl = findUp(eltParent, elt, -1);
            break;
            
          case 40: // down
            event.preventDefault();
            direction = 1;
            nextEl = findDown(eltParent, elt, 1);
            break;
      }
      
      nextEl = $(nextEl);
      if (nextEl.length && nextEl.hasClass('children')){
        // wiwo: associate the scope id with the displayed element.
        let scopeId = nextEl.data('scopeId');
        inspectScope(scopeId);
        selectItem(nextEl);
      }
    }
    
    var indexOf = Array.prototype.indexOf;
    function findUp(eltParent, selectedElt, direction){
      /*
      start at elt
       - query for .children
         - if len > 0: 
           - get index of `selectedElt` in parent
           - get element at `index + direction` in elt children list -> return as result
         - else: 
           - recursively call `findNext` passing `elt.parent` as first param, `elt` as second param
      */
      var children = eltParent.querySelectorAll(':scope > .children');
      
      var index = 0;
      if (eltParent != selectedElt){
        index = indexOf.call(children, selectedElt);
      }
      var nextIndex = index + direction;
      
      if (nextIndex < 0 ){
        result = selectedElt.parentElement;
      } else if (nextIndex < children.length){
        // Recursively get the last child in this tree.
        result = getLast(children[nextIndex]);
      } else if (eltParent.parentElement && eltParent.parentElement.classList.contains('children')) {
        result = findUp(eltParent.parentElement, eltParent, direction);
      }
      
      return result;
    }
    
    
    function getLast(el){
      var result = el;
      
      var children = el.querySelectorAll(':scope > .children');
      if (children.length){
        result = getLast(children[children.length - 1]);
      }
      return result;
    }
    
    
    function findDown(eltParent, selectedElt, direction){
      /*
      start at elt
       - query for .children
         - if len > 0: 
           - get index of `selectedElt` in parent
           - get element at `index + direction` in elt children list -> return as result
         - else: 
           - recursively call `findNext` passing `elt.parent` as first param, `elt` as second param
      */
      var children = eltParent.querySelectorAll(':scope > .children');
      
      var nextIndex = 0;
      if (eltParent != selectedElt){
        var index = indexOf.call(children, selectedElt);
        nextIndex = index + direction;
      }
      
      if (nextIndex < 0 ){
        result = selectedElt.parentElement;
      } else if (nextIndex < children.length){
        result = children[nextIndex];
      } else if (eltParent.parentElement && eltParent.parentElement.classList.contains('children')) {
        result = findDown(eltParent.parentElement, eltParent, direction);
      }
      
      return result;
    }
    

  }
}


// TODO: tabindex
function newBranchElement(descriptor) {
  return angular.element([
    '<ol class="children expanded">',
      '<div class="selection"></div>',
      '<span>',
        '<span class="webkit-html-tag">&lt;</span>',
        '<span class="webkit-html-attribute">Scope #', descriptor, '</span>',
        '<span class="webkit-html-tag">&gt;</span>',
      '</span>',
    '</ol>'].join(''));
}
