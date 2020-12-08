#!/usr/bin/env ruby
# encoding: utf-8

require 'bundler'
Bundler.require(:default)
require 'json'


COLOR_GROUP_TABLE = {
  "#ccccff" => { short: "x8/lsm", description: '8-bit Load/Store/Move'},
  "#ccffcc" => { short: "x16/lsm", description: '16-bit Load/Store/Move' },
  "#ffff99" => { short: "x8/alu", description: '8-bit Arithmetic Logic Unit' },
  "#ffcccc" => { short: "x16/alu", description: '16-bit Arithmetic Logic Unit'},
  "#80ffff" => { short: "x8/rsb", description: '8-bit ???' },
  "#ffcc99" => { short: "control/br", description: 'branch' },
  "#ff99cc" => { short: "control/misc", description: 'misc' }
}

# function generates the page css
def css
%Q(
  <style>
    body {
      font-family: arial;
    }
    table.unprefixed, table.cbprefixed {
      min-width: 90%;
      border-width: 1px;
      border-style: solid;
      border-color: black;
      border-collapse: collapse;
    }

    table.unprefixed th, table.cbprefixed th {
      background-color: #cccccc;
      border-width: 1px;
			border-style: solid;
			border-color: black;
			border-collapse: collapse;
      padding: 10px;
    }

    table.unprefixed td, table.cbprefixed td {
      text-align: center;
			border-width: 1px;
			border-style: solid;
			border-color: black;
			border-collapse: collapse;
      font-size: 10pt;
		}
    td.x8-lsm { background-color: #ccccff; }
    td.x16-lsm { background-color: #ccffcc; }
    td.x8-alu { background-color: #ffff99; }
    td.x16-alu { background-color: #ffcccc; }
    td.x8-rsb { background-color: #80ffff; }
    td.control-br { background-color: #ffcc99; }
    td.control-misc { background-color: #ff99cc; }
  </style>
)
end

# generates all html meta, used inside the head element
def meta
  %Q(
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta property="og:title" content="Game Boy opcode table" />
  <meta name="author" content="Luís Mendes" />
  <meta property="og:locale" content="en_US" />
  <meta name="description" content="Game Boy CPU (Sharp LR35902) instruction set" />
  <meta property="og:description" content="Game Boy CPU (Sharp LR35902) instruction set" />
  <link rel="canonical" href="https://gb.insertcoin.dev/" />
  <meta property="og:url" content="https://gb.insertcoin.dev/" />
  <meta property="og:site_name" content="Game Boy opcode table" />
  <script type="application/ld+json">
    {"url":"https://gb.insertcoin.dev/","@type":"WebSite","headline":"ink","author":{"@type":"Person","name":"Luís Mendes"},"description":"Game Boy CPU (Sharp LR35902) instruction set","name":"Game Boy opcode table","@context":"https://schema.org"}
  </script>
)
end

# This function generates the <td> for each one of the opcode tables
def cell(op, index, table_type)
  snippet = ""
  if op.nil?
    snippet += "<td class='opcode op-#{index} unused'></td>"
  else
    snippet += "<td class='opcode op-#{index} #{op['group'].to_s.tr('/', '-')}'>"
    snippet += "  <div class='mnemonic'>"
    snippet += "    #{op['mnemonic']} "
    snippet += "    #{op['operand1']}"   if op['operand1']
    snippet += "    , #{op['operand2']}" if op['operand2']
    snippet += "  </div>"
    snippet += "  <div>"
    snippet += "    <span class='length'>#{op['length']}</span>"
    snippet += "    <span class='cycles'>#{op['cycles'].join("-")}</span>"
    snippet += "  </div>"
    snippet += "  <div class='flags'>#{op['flags'].join(' ')}</div>"
    snippet += "</td>"
  end
  snippet
end

def table(json, range, table_type)
  html = "<h2>#{table_type}</h2>"
  html += "<table class='#{table_type}'>"
  html += "<thead><tr><th>0x??</th>" + range.collect{ |i| "<th>0x?#{i.to_s(16)}</th>" }.join + "</tr></thead>"
  html += "<tbody>"
  range.each do |row|
    row_hex = row.to_s(16)
    html += "<tr>"
    html += "<th>0x#{row_hex}?</th>"
    range.each do |col|
      col_hex  = col.to_s(16)
      index    = "0x#{row_hex}#{col_hex}"
      op       = json[table_type][index]
      html += cell(op, index, table_type)
    end
    html += "</tr>"
  end
  html += "</tbody>"
  html += "</table>"
end

def color_opcode_group_table
  html = "<section>"
  html = "  <h2>Instruction groups:</h2>"
  html += " <table>"
  COLOR_GROUP_TABLE.each do |k, v|
    html += " <tr>"
    html += "   <td class='#{v[:short].to_s.tr('/', '-')}'>&nbsp;&nbsp;&nbsp;</td><td>#{v[:short]} - #{v[:description]}</td>"
    html += " </tr>"
  end
  html += " </table>"
  html += "</section>"
  html
end

def run
  range = (0x0..0xF)
  json = JSON.parse(File.read(File.join('./', 'opcodes.json').to_s))
  html = "<!DOCTYPE html>"
  html += "<html lang='en'>"
  html += "<head>"
  html += " <title>Game Boy opcode table</title>"
  html += meta()
  html += css()
  html += "</head>"
  html += "<body>"

  html += "<h1>Gameboy CPU (LR35902) instruction set</h1>"
  html += " <p>This Gameboy CPU opcode table was generated using <a href='https://raw.githubusercontent.com/lmmendes/game-boy-opcodes/master/opcodes.json' target='_blank'>opcodes.json</a> from <a href='https://github.com/lmmendes/game-boy-opcodes' target='_blank'>lmmendes/game-boy-opcodes</a> project on github. If you find a bug please open a <a href='https://github.com/lmmendes/game-boy-opcodes/issues'>issue</a>.</p>"

  html += table(json, range, "unprefixed")
  html += table(json, range, "cbprefixed")

  html += color_opcode_group_table()

  html += "</body>"
  html += "</html>"
  File.write("json2html.html", html)
end

# execute the file
run()
