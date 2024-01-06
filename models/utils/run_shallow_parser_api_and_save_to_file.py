"""
Run shallow parser API on sentences and save them into a file.
It is expected that each line contains a single sentence which is fully tokenized.
"""
from argparse import ArgumentParser
import requests
from json import dumps
import sys


url = "https://ssmt.iiit.ac.in/indic_shallow_parser_v1"


def read_text_from_file(file_path):
    """Read text from a file."""
    #print("file path",file_path)
    with open(file_path, 'r', encoding='utf-8') as file_read:
        return file_read.read().strip()


def write_text_to_file(text, file_path):
    """Write text to a file."""
    with open(file_path, 'w', encoding='utf-8') as file_write:
        file_write.write(text)


def send_request_and_get_response(text, language='hin'):
    """Send shallow parser request to URL and get the response."""
    data = {'text': text, 'language': language}
    headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
    r = requests.post(url, data=dumps(data), headers=headers)
    return r.json()


def main():
    """Pass arguments and call functions here."""
    parser = ArgumentParser()
    parser.add_argument('--input', dest='inp', help='Enter the input file path')
    parser.add_argument('--output', dest='out', help='Enter the output file path')
    parser.add_argument('--lang', dest='lng', help='Enter the language of the shallow parser', default='hin')
    args = parser.parse_args()
    #print("Arguments",args)
    text = read_text_from_file(args.inp)
    #print("text",text)
    json_output = send_request_and_get_response(text, args.lng)
    #print("json_output", json_output)
    # data field in the json_output contains the shallow parsed output in unicode (UTF-8) in SSF format.
    # data_wx field in the json_output contains the shallow parsed output in WX in SSF format.
    # the shallow parser can handle multiple sentences (separated by \n or new line) in one call
    ssf_sentences = json_output['data']
    write_text_to_file(ssf_sentences, args.out)


if __name__ == '__main__':
    main()
