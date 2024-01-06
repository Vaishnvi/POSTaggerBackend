# Run shallow parser API, save it into a file, and convert it into CONLL format.
# For POS set level as 1
# For POS and Morph set level as 2
# For POS and Chunk set level as 3
# For POS, Chunk and Morph set level as 4
input_file=$1
language=$2
level=$3
echo $input_file $language $level
#echo(hgjgjg)
python3 /Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/run_shallow_parser_api_and_save_to_file.py --input $input_file --output $input_file".shallow_parsed.ssf" --lang $language
python3 /Users/vaishnavikhindkar/Documents/PL/POSTagger_Backend/models/utils/extract_data_from_ssf_in_conll_format_for_file.py --input $input_file".shallow_parsed.ssf" --output $input_file".shallow_parsed.conll" --level $level
