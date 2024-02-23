import { defineStore } from 'pinia'
import books from '../../../../public/books/books.json'

export const useReaderStore = defineStore('reader', {
  state: () => {
    return {
      theme: 'default',
      flow: 'paginated',
      font: '',
      lineSpacing: 1.5,
      fontSize: 100,
      bookList: books,
    }
  },
  actions: {
    setTheme(theme) {
      this.theme = theme
    },
    reset() {
      this.theme = 'default'
      this.flow = 'paginated'
      this.font = ''
      this.lineSpacing = 1.5
      this.fontSize = 100
    },
    setBook(id, info) {
      const index = this.bookList.findIndex((book) => book.id === id)
      if (index > -1) {
        this.bookList[index] = info
      }
    },
    addBook({ id, uuid, pubDate, author, language, title, coverPath, url}) {
      const book = {
        readibleId: id,
        date: pubDate,
        creator: author,
        UUID: uuid,
        language: language,
        title: title,
        coverPath: coverPath,
        url: url,
        bgColorFromCover: "#076184",
        size: 435507,
        from: "url"
      }
      this.bookList.push(book)
    },
    hasBook(readibleId) {
      for (let i = 0; i < this.bookList.length; i++){
        if (this.bookList[i].readibleId){
          if (this.bookList[i].readibleId === readibleId){
            return true
          }
        }
      }
      return false
    },
    delBook(bookIndex) {
      const index = this.bookList.findIndex((item) => bookIndex === item.id)
      if (index > -1) {
        this.bookList.splice(index, 1)
      }
    },
    delBookByID(readibleId) {
      for (let i = 0; i < this.bookList.length; i++){
        if (this.bookList[i].readibleId){
          if (this.bookList[i].readibleId === readibleId){
            this.delBook(i)
            return
          }
        }
      }
    },
  },
  persist: true,
})
