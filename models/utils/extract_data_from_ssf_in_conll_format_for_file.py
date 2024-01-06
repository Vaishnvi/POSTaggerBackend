"""
Extract data at different levels from SSF file in CONLL format.
For token/word+pos:
python extract_data_from_ssf_in_conll_format_for_file.py --input input_file --output output_file --level 1
For token/word+pos+morph:
python extract_data_from_ssf_in_conll_format_for_file.py --input input_file --output output_file --level 2
For token/word+pos+chunk:
python extract_data_from_ssf_in_conll_format_for_file.py --input input_file --output output_file --level 3
For token/word+pos+chunk+morph:
python extract_data_from_ssf_in_conll_format_for_file.py --input input_file --output output_file --level 4
"""
from argparse import ArgumentParser
import ssfAPI as ssf
import re


def readFileAndExtractSentencesInConLL(inputFilePath, outputFilePath, level=0):
    """Read an SSF file and extract sentence in CoNLL at different levels."""
    #print("inputFilePath",inputFilePath)
    d = ssf.Document(inputFilePath)
    sentencesList = []
    for tree in d.nodeList:
        if level == 0:
            sentencesList.append('\n'.join([token for token in tree.generateSentence().split() if not re.search('^NUL', token)]) + '\n')
        elif level == 1:
            tokensWithPOS = []
            for chunkNode in tree.nodeList:
                if chunkNode.__class__.__name__ == 'ChunkNode':
                    if re.search('^NULL', chunkNode.type):
                        continue
                    for node in chunkNode.nodeList:
                        if node.__class__.__name__ == 'ChunkNode':
                            continue
                        if not re.search('^NUL', node.lex):
                            tokensWithPOS.append(node.lex + '\t' + node.type.replace('__', '_'))
                elif chunkNode.__class__.__name__ == 'Node':
                    if not re.search('^NUL', chunkNode.lex):
                        tokensWithPOS.append(chunkNode.lex + '\t' + chunkNode.type.replace('__', '_'))
            sentencesList.append('\n'.join(tokensWithPOS) + '\n')
        elif level == 2:
            tokensWithPOSMorph = []
            for chunkNode in tree.nodeList:
                if re.search('^NULL', chunkNode.type):
                    continue
                for node in chunkNode.nodeList:
                    if not re.search('^NUL', node.lex):
                        pos = node.type.replace('__', '_')
                        if node.getAttribute('af'):
                            tokensWithPOSMorph.append(node.lex + '\t' + pos + '\t' + node.getAttribute('af'))
                        else:
                            tokensWithPOSMorph.append(node.lex + '\t' + pos + '\t' + node.lex + ',,,,,,,')
            sentencesList.append('\n'.join(tokensWithPOSMorph) + '\n')
        elif level == 3:
            tokenPOSAndChunk = []
            for chunkNode in tree.nodeList:
                if re.search('^NULL', chunkNode.type):
                    continue
                for indexNode, node in enumerate(chunkNode.nodeList):
                    if indexNode == 0:
                        if not re.search('^NUL', node.lex):
                            tokenPOSAndChunk.append(node.lex + '\t' + node.type.replace('__', '_') + '\tB-' + chunkNode.type)
                    else:
                        if not re.search('^NUL', node.lex):
                            lastChunk = tokenPOSAndChunk[-1].split('\t')[2]
                            lastChunkType = lastChunk.split('-')[1]
                            if lastChunkType == chunkNode.type:
                                tokenPOSAndChunk.append(node.lex + '\t' + node.type.replace('__', '_') + '\tI-' + chunkNode.type)
                            else:
                                tokenPOSAndChunk.append(node.lex + '\t' + node.type.replace('__', '_') + '\tB-' + chunkNode.type)
            sentencesList.append('\n'.join(tokenPOSAndChunk) + '\n')
        else:
            tokenPOSChunkMorph = []
            for chunkNode in tree.nodeList:
                if re.search('^NULL', chunkNode.type):
                    continue
                for indexNode, node in enumerate(chunkNode.nodeList):
                    if node.getAttribute('af'):
                        morphFeat = node.getAttribute('af')
                    else:
                        morphFeat = node.lex + ',,,,,,,'
                    if indexNode == 0:
                        if not re.search('^NUL', node.lex):
                            tokenPOSChunkMorph.append(node.lex + '\t' + node.type.replace('__', '_') + '\tB-' + chunkNode.type + '\t' + morphFeat)
                    else:
                        if not re.search('^NUL', node.lex):
                            lastChunk = tokenPOSChunkMorph[-1].split('\t')[2]
                            lastChunkType = lastChunk.split('-')[1]
                            if lastChunkType == chunkNode.type:
                                tokenPOSChunkMorph.append(node.lex + '\t' + node.type.replace('__', '_') + '\tI-' + chunkNode.type + '\t' + morphFeat)
                            else:
                                tokenPOSChunkMorph.append(node.lex + '\t' + node.type.replace('__', '_') + '\tB-' + chunkNode.type + '\t' + morphFeat)
            sentencesList.append('\n'.join(tokenPOSChunkMorph) + '\n')
    #print("sentencesList", sentencesList)#,"sentencesList[0]:",sentencesList[0],"ended")
    sentencesList1 = '\n'.join(sentencesList)
    print("sentencesList1", sentencesList1)
    writeListToFile(sentencesList1, outputFilePath)


def writeListToFile(dataList, outFilePath):
    with open(outFilePath, 'w', encoding='utf-8') as fileWrite:
        fileWrite.write('\n'.join(dataList) + '\n')


def main():
    """Pass arguments and call functions here."""
    parser = ArgumentParser()
    parser.add_argument('--input', dest='inp', help="Add the input file path")
    parser.add_argument('--output', dest='out', help="Add the output file path")
    parser.add_argument('--level', dest='level', help="Add the level 0: token, 1: token + pos, 2: token + pos + morph, 3 for token + pos + chunk, 4 for token + pos + chunk + morph", type=int, default=0)
    args = parser.parse_args()
    readFileAndExtractSentencesInConLL(args.inp, args.out, args.level)


if __name__ == '__main__':
    main()
