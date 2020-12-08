#!/usr/bin/env ruby
# encoding: utf-8

require 'bundler'
Bundler.require(:default)

require 'open-uri'
require 'json'

if !File.exists? 'opcodes.html'
  html = open 'http://www.pastraiser.com/cpu/gameboy/gameboy_opcodes.html'
  File.open('opcodes.html', 'w') do |f|
    f.write html.read.force_encoding('UTF-8')
  end
end

COLOR_GROUP_TABLE = {
  "#ccccff" => "x8/lsm",
  "#ccffcc" => "x16/lsm",
  "#ffff99" => "x8/alu",
  "#ffcccc" => "x16/alu",
  "#80ffff" => "x8/rsb",
  "#ffcc99" => "control/br",
  "#ff99cc" => "control/misc"
}

PATCH_OPCODES = {
  "unprefixed" =>{
    "0x10" => {
      "length" => 1
    },
    "0xe2" => {
      "length" => 1
    },
    "0xf2" => {
      "length" => 1
    }
  }
}

def table_extractor(table, table_name)
  opcodes = {}
  op_index = 0
  table.css('tr').each_with_index do |tr, tr_index|
    next if tr_index == 0
    tr.css('td').each_with_index do |td, td_index|
      next if td_index == 0
      next if td.text  == '&nbsp;'
      opcode, operators = td.children[0].text.split(' ')
      if [1].include? opcode.size
        op_index+=1
        next
      end
      operand1, operand2 = operators.to_s.split(',')
      length, cycles = td.children[2].text.split(/[[:space:]]+/)
      flags = td.children[4].text.split(/[[:space:]]+/)
      addr  = "0x#{(tr_index-1).to_s(16)}#{(td_index-1).to_s(16)}"
      opcolor = td["bgcolor"]
      opcodes[ addr ] = {
        "mnemonic" => opcode,
        "length"   => length.to_i,
        "cycles"   => cycles.split('/').collect(&:to_i),
        "flags"    => flags,
        "addr"     => addr
      }
      opcodes[ addr ]["group"]    = COLOR_GROUP_TABLE[opcolor] if COLOR_GROUP_TABLE[opcolor]
      opcodes[ addr ]["operand1"] = operand1.to_s if operand1
      opcodes[ addr ]["operand2"] = operand2.to_s if operand2
      op_index+=1

      # apply patches id needed
      if PATCH_OPCODES[table_name] && PATCH_OPCODES[table_name][addr]
        puts "patching #{addr} on #{table_name}"
        opcodes[ addr ] = opcodes[ addr ].merge(PATCH_OPCODES[table_name][addr])
      end
    end
  end
  opcodes
end

# puts File.open('opcodes.html', encoding: 'UTF-8').read
html = Oga.parse_html File.open('opcodes.html').read
tables = html.css('table')
opcodes = {
  'unprefixed' => table_extractor(tables[0], "unprefixed"),
  'cbprefixed' => table_extractor(tables[1], "cbprefixed")
}

File.open('opcodes.json', 'w').write JSON.pretty_generate(opcodes)
