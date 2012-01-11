import os
from datetime import datetime, date, time
from Cheetah.Template import Template
import markdown2
import yaml

with open('base.tmpl') as tmpl:
	template = tmpl.read()

def parse_file(path):
	with open(path) as f:
		doc = f.read()
		
	metadata, content = doc.split('\n...\n')
	
	block = yaml.load(metadata)
	if 'date' in block:
		parts = [int(part) for part in block['date'].split('/')]
		block['date'] = date(parts[2], parts[0], parts[1])
	#if 'time' in block:
		#block['time'] = 
	block['content'] = markdown2.markdown(content)

	return block

def generate_page(d):
	files = os.listdir(d)
	blocks = []
	
	for file in files:
		blocks.append(parse_file(os.path.join(d, file)))
	
	blocks = reversed(sorted(blocks, key=lambda block: block['date']))	
	
	if(d == 'wobsite'): 
		html_file = 'index.html'
	else:
		html_file = d+'.html'
	with open(html_file, 'w') as outfile:
		outfile.write(str(Template(template, {'blocks': blocks})))

ls = os.listdir('.')
pages = []
for l in ls:
	if not os.path.isdir(l) or l == 'html' or l[0] == '.': continue
	generate_page(l)
	
