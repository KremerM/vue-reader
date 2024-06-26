<template>
  <el-container direction="vertical">
    <titlebar backdrop shadow>
      <el-upload :auto-upload="false" accept=".epub" :on-change="selectFile" :multiple="false" :show-file-list="false">
        <el-button size="small" :icon="Plus" circle title="Add To Library"></el-button>
      </el-upload>
    </titlebar>
    <!-- 书籍列表 -->
    <el-main class="main" ref="main">
      <div class="grid" ref="grid">
        <div v-for="(info, index) in bookList" :key="index">
          <!-- 主体 -->
          <el-card @click="readerBook(info)" ref="card" shadow="hover" class="box-card" :body-style="{ padding: '0px' }">
            <el-image :lazy="true" :src="info.coverPath" fit="fill" class="el-image" crossOrigin="anonymous">
              <template #error>
                <div class="image-slot">
                  <el-icon><icon-picture /></el-icon>
                </div>
              </template>
            </el-image>
            <!-- 提示 -->
            <el-popover trigger="hover" placement="right">
              <template #reference>
                <div class="title" :style="{
                  background: info.bgColorFromCover
                    ? info.bgColorFromCover
                    : '#6d6d6d',
                }">
                  {{ trunc(info.title, 12) }}
                </div>
              </template>
              <!-- 书籍信息 -->
              <div>
                <p>
                  <el-button type="primary" round :icon="Download" @click="download(info.url)">Download</el-button>
                </p>
                <p>
                  <el-button type="primary" round :icon="Delete" @click="delFile(info.id)">Delete</el-button>
                </p>
                <el-divider />
                <p v-if="info.title">Title: {{ info.title }}</p>
                <p v-if="info.creator">Creator: {{ info.creator }}</p>
                <p v-if="info.description">
                  Description:
                  <span :title="info.description">
                    {{ trunc(info.description, 30) }}</span>
                </p>
                <p v-if="info.publisher">Publisher: {{ info.publisher }}</p>
                <p v-if="info.date">
                  Pub Date:
                  {{ publishDate(info.date) || publishDate(info.publishDate) }}
                </p>
                <p v-if="info.language">Language: {{ info.language }}</p>
                <p v-if="info.size">File Size: {{ formatSize(info.size) }}</p>
              </div>
            </el-popover>
          </el-card>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import {
  Plus,
  Download,
  Delete,
  Picture as IconPicture,
} from '@element-plus/icons-vue'
import titlebar from './Titlebar.vue'
import fileSaver from 'file-saver'
import { db } from './utils/db'
import { getFileMD5 } from './utils/md5'
import { useReaderStore } from './utils/stores'
import { ref, reactive, toRefs, onMounted, onBeforeUnmount } from 'vue'

const reader = useReaderStore()
console.log('Imported Books: ', reader.bookList.length)
const bookList = reader.bookList.sort((a, b) => {
  if (a.lastOpen && b.lastOpen) {
    return b.lastOpen - a.lastOpen
  } else {
    return 1
  }
})
console.log('Books: ', bookList)

const { saveAs } = fileSaver
const grid = ref(null)
const main = ref(null)
const data = reactive({
  maxColWidth: 280,
  gap: 32,
})
let items = []

const { maxColWidth, gap } = toRefs(data)
const props = defineProps({
  useMin: {
    type: Boolean,
    default: false,
  },
  maxCols: {
    type: Number, // Maximum number of colums. Default: Infinite
    default: Infinity,
  },
})
const { useMin, maxCols } = props

onMounted(async () => {
  if (!bookList.length) return
  initStyle()
  positionItems()
  window.addEventListener('resize', resize)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
})
const trunc = (str, n) => {
  return str.length > n ? `${str.substr(0, n - 3)}...` : str
}
const publishDate = (val) => {
  const date = new Date(val)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDay()
  return `${year}-${month}-${day}`
}
//style
const initStyle = () => {
  items = grid.value.children
  if (items.length === 0) return
  main.value.$el.style.position = 'relative'
  Array.prototype.forEach.call(items, (item) => {
    item.style.position = 'absolute'
    item.style.maxWidth = `${maxColWidth.value}px`
    item.style.transition =
      'top 0.2s ease, left 0.2s ease, right 0.2s ease, buttom 0.2s ease'
  })
}
const positionItems = () => {
  if (items.length === 0) return

  let { cols, wSpace } = setup()

  wSpace = Math.floor(wSpace / 2)

  Array.prototype.forEach.call(items, (item, i) => {
    const min = nextCol(cols, i)

    const left = min.index * colWidth() + wSpace

    item.style.left = `${left}px`
    item.style.top = `${min.height + min.top}px`

    min.height += min.top + item.getBoundingClientRect().height
    min.top = gap.value
  })
  main.value.$el.style.height = `${getMax(cols).height}px`
}
const nextCol = (cols, i) => {
  if (useMin) return getMin(cols)
  return cols[i % cols.length]
}
const colWidth = () => {
  let width = items[0].getBoundingClientRect().width + gap.value
  return width
}
const getMin = (cols) => {
  let min = cols[0]
  cols.forEach((col) => {
    if (col.height < min.height) min = col
  })
  return min
}
const getMax = (cols) => {
  let max = cols[0]
  cols.forEach((col) => {
    if (col.height > max.height) max = col
  })
  return max
}
const setup = () => {
  const { width } = main.value.$el.getBoundingClientRect()
  let numCols = Math.floor(width / colWidth()) || 1
  const cols = []

  if (maxCols && numCols > maxCols) {
    numCols = maxCols
  }

  for (let i = 0; i < numCols; i += 1) {
    cols[i] = {
      height: 0,
      top: 0,
      index: i,
    }
  }

  const wSpace = width - numCols * colWidth() + gap.value

  return {
    cols,
    wSpace,
  }
}
const resize = () => {
  setTimeout(positionItems(), 200)
}
//books info
const formatSize = (size) => {
  return size / 1024 / 1024 > 1
    ? parseFloat(size / 1024 / 1024 + '').toFixed(2) + 'Mb'
    : parseInt(size / 1024 + '') + 'Kb'
}
const download = (url) => {
  saveAs('/books/' + url, url)
}
const emit = defineEmits(['update:currentBook'])
//reader
const readerBook = (info) => {
  console.log("Reader book url type: ", typeof info.url)
  console.log("Reader book byte length: ", info.url.byteLength)
  console.log("Reader book url: ", info.url)
  emit('update:currentBook', info)
}
//导入
const selectFile = async (item) => {
  const { raw, name, size } = item
  // const md5 = await getFileMD5(raw)
  // const res = await db.books.get({ md5 })
  // if (res) return ElMessage.error('图书重复')
  // const reader = new FileReader()
  // reader.onerror = (error) => {
  //     console.log(error)
  // }
  // reader.onloadend = (e) => {
  //     const file = { buffer: reader.result, size, name, md5 }
  //     saveFile(file)
  // }
  // reader.readAsArrayBuffer(raw)
  //不存储
  const freader = new FileReader()
  freader.onerror = (error) => {
    console.log(error)
  }
  freader.onloadend = (e) => {
    console.log(freader)
    emit('update:currentBook', freader.result)
  }
  freader.readAsArrayBuffer(raw)
}
const saveFile = async (file) => {
  //保存文件
  const id = await db.books.add(file)
  emit('update:currentBook', id)
}
const delFile = (id) => {
  reader.delBook(id)
}
</script>

<style scoped lang="scss">
::-webkit-scrollbar {
  display: none;
}

.main {

  /* margin-top: 40px; */
  .grid {
    margin: 40px;

    .box-card {
      width: 170px;
      height: 250px;
      user-select: none;
      cursor: pointer;

      .el-image {
        height: 200px;
        width: 100%;

        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: var(--el-fill-color-light);
          color: var(--el-text-color-secondary);
          font-size: 30px;
        }
      }

      .title {
        top: -3px;
        width: 100%;
        padding: 0 10px;
        height: 50px;
        font-size: 14px;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #ffffff;
        position: relative;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
