import { reactive } from 'vue'

export const con = reactive({
  lines: [],
  input: '',
  busy: false,
  seq: 0
})

export function pushLine(text, cls) {
  con.lines.push({ id: ++con.seq, text, cls })
}

export function clearConsole() {
  con.lines = []
  con.seq = 0
  con.input = ''
}
