// my-vue-plugin.js

import App from './src/App.vue';
import VueReader from './src/components/reader/Start.vue';

// You can also include any additional functionality here, such as directives or mixins.

const VueReaderPlugin = {
  install(Vue, options) {
    // Register your components globally
    Vue.component('VueReader', VueReader);

    const pinia = app.config.globalProperties.$pinia;
    // You can also add Vue.prototype enhancements, directives, mixins, etc.
    
  }
};

export default VueReaderPlugin;

// Automatic installation if Vue has been added to the global scope.
if (typeof window !== 'undefined' && window.Vue) {
  window.Vue.use(VueReaderPlugin);
}