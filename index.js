import { createPinia } from 'pinia';
import ReaderStart from './src/components/reader/Start.vue';

export default {
  install: (app) => {
    const pinia = createPinia();
    app.use(pinia);
    app.component('ReaderStart', ReaderStart);
  }
};