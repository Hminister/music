import "./icon.js"
import "./swiper"
import Swiper from "./swiper"

class Player {

  constructor(node) {
    this.root = typeof node === "string" ? document.querySelector(node) : node
    
    this.$ = selector => this.root.querySelector(selector)
    this.$$ = selector => this.root.querySelectorAll(selector)
    
    this.songList = []
    this.currentIndex = 1
    this.audio = new Audio()
    
    this.start()
    this.bind()

    this.lyricsArr = []
    this.lyricIndex = -1
  }

  start() {
    fetch("https://qdywxs.github.io/data-mock/qdywxs-music/music-list.json")
      .then(res => res.json())
      .then(data => {
        this.songList = data  
        this.loadSong() 
      })
  }
  
  loadSong() {
    let songObj = this.songList[this.currentIndex] 
    this.audio.src = songObj.url 

    this.$(".header h1").innerText = songObj.title
    this.$(".header p").innerText = songObj.author + "-" + songObj.album

    this.audio.onloadedmetadata = () => this.$(".time-end").innerText = this.formateTime(this.audio.duration)
    this.loadLyric()
  }

  formateTime(secondsTotal) {
    let mimutes = parseInt(secondsTotal/60)
    mimutes = mimutes >= 10 ? "" + mimutes : "0" + mimutes
    let seconds = parseInt(secondsTotal%60)
    seconds = seconds >= 10 ? "" + seconds : "0" +seconds
    return mimutes + ":" + seconds
  }

  loadLyric() {
    fetch(this.songList[this.currentIndex].lyric)
    .then(res=>res.json())
    .then(data => {
      this.setLyrics(data.lrc.lyric)
      window.lyrics = data.lrc.lyric
    })
  }

  setLyrics(lyrics) {
     console.log(lyrics)
     this.lyricIndex = 0
     let fragment = document.createDocumentFragment()
     let lyricsArr = []
     this.lyricsArr = lyricsArr
     lyrics.split(/\n/)
     .filter(str => str.match(/\[.+?\]/))
     .forEach(line => {
       let str = line.replace(/\[.+?\]/, "")
       line.match(/\[.+?\]/g).forEach(t=>{
         t = t.replace(/[\[\]]/g, "")
         let milliseconds = parseInt(t.slice(0,2))*60*1000 + parseInt(t.slice(3,5))*1000 + parseInt(t.slice(6))
         lyricsArr.push([milliseconds, str])
       })
     });

     lyricsArr.filter(line => line[1].trim() !== "").sort((v1,v2) => {
       if(v1[0] > v2[0]){
         return 1
       }else {
         return -1
       }
     }).forEach(line => {
       let node = document.createElement("p")
       node.setAttribute("data-time", line[0])
       node.innerText = line[1]
       fragment.appendChild(node)
     })

     this.$(".panel-lyrics .container").innerHTML = ""
     this.$(".panel-lyrics .container").appendChild(fragment)
  }

  playSong() {
    this.audio.oncanplaythrough = () => this.audio.play()
  }

  bind() { 
    let self = this
    this.$(".btn-play-pause").onclick = function() {
      if(this.classList.contains("playing")) {
        self.audio.pause()

        this.classList.remove("playing")
        this.classList.add("pause")
        this.querySelector("use").setAttribute("xlink:herf", "#icon-play")

      }else if(this.classList.contains("pause")) {
        self.audio.play()
        this.classList.remove("pause")
        this.classList.add("playing")

        this.querySelector("use").setAttribute("xlink:herf", "#icon-pause")
      }
			self.playSong()
    };
    this.$(".btn-pre").onclick = function() {
      self.currentIndex = (self.currentIndex-1 + self.songList.length) % self.songList.length
      self.loadSong()
      self.playSong()
    };
    this.$(".btn-next").onclick = function() {
      self.currentIndex = (self.currentIndex + 1) % self.songList.length
      self.loadSong()
      self.playSong() 
    };
    let swiper = new Swiper(this.$(".panels"))

    swiper.on("swipLeft", function(){
      this.classList.remove("panel1")
      this.classList.add("panel2")
      console.log("left")
    })

    swiper.on("swipRight", function(){
      this.classList.remove("panel2")
      this.classList.add("panel1")
      console.log("right")
    })
    
    this.audio.ontimeupdate = function() {
      //歌词
      self.locateLyric()
      //进度条
      self.setProgeressBar()
    }
  }

  locateLyric() {
    let currentTime = this.audio.currentTime*1000

    let nextLineTime = this.lyricsArr[this.lyricIndex + 1][0]

  if(currentTime > nextLineTime && this.lyricIndex < this.lyricsArr.length - 1) {
    this.lyricIndex++
    let node = this.$(`[data-time="${this.lyricsArr[this.lyricIndex][0]}"`)
    if(node) this.setLyrictoCenter(node)
    this.$$(".panel-effect .lyric p")[0].innerText = this.lyricsArr[this.lyricIndex][1]
    this.$$(".panel-effect .lyric p")[1].innerText = this.lyricsArr[this.lyricIndex+1][1] ? this.lyricsArr[this.lyricIndex+1][1] : ""
  }
  }
  setLyrictoCenter(node) {
    let translateY = node.offsetTop - this.$(".panel-lyrics").offsetHeight / 2
    translateY = translateY > 0 ? translateY : 0
    this.$(".panel-lyrics .container").style.transform = `translateY(-${translateY}px)`
    this.$$(".panel-lyrics p").forEach(node => node.classList.remove("current"))
    node.classList.add("current")
  }
  setProgeressBar() {
    let percent = (this.audio.currentTime * 100 / this.audio.duration) + "%"
    this.$(".bar .progress").style.width = percent
    this.$(".time-start").innerHTML = this.formateTime(this.audio.currentTime)
  }
}

window.p = new Player("#player")
