import pandas as pd

# Replace with your actual file name
input_file = "004.PIMC off 3db setup down 1 time 60s.txt"
output_file = "output.xlsx"

# Read the .txt file (space or tab delimited)
df = pd.read_csv(input_file, delim_whitespace=True)

# Save to Excel
df.to_excel(output_file, index=False)

print("Conversion complete! Excel file saved as:", output_file)
