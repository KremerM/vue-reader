import { createPinia } from 'pinia';
import ReaderStart from './src/components/reader/Start.vue';
import { useReaderStore } from './src/components/reader/utils/stores'

export default {
  install: (app) => {
    app.component('ReaderStart', ReaderStart);
  }
};

export { useReaderStore };