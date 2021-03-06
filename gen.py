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

def generate_dir(d):
	os.mkdir(os.path.join('out', d))

	if(d == 'wobsite'): 
		html_file = 'index.html'
	else:
		html_file = d+'.html'

	print('generating ' + html_file)

	files = os.listdir(d)
	blocks = []
	
	for file in files:
		page = os.path.join(d, file.replace('.md', '.html'))
		print('generating ' + page)

		block = parse_file(os.path.join(d, file))
		block['link'] = page

		blocks.append(block)
		make_page(page, [block])
	
	blocks = reversed(sorted(blocks, key=lambda block: block['date']))	
	make_page(html_file, blocks)
	
def make_page(html_file, blocks):
	with open('out/' + html_file, 'w') as outfile:
		outfile.write(str(Template(template, {'blocks': blocks})))

os.system('rm -r out; mkdir out')

ls = os.listdir('.')
pages = []
for l in ls:
	if not os.path.isdir(l) or l in ['out', 'resources'] or l[0] == '.': continue
	generate_dir(l)
	
