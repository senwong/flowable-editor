
const $rootScope = {};

$rootScope.editorFactory = {
  privateResolve: null,
};
$rootScope.editorFactory.promise = new Promise((resolve, reject) => {
  $rootScope.editorFactory.privateResolve = resolve;
});
$rootScope.editorFactory.resolve = () => $rootScope.editorFactory.privateResolve();


export default  $rootScope;
