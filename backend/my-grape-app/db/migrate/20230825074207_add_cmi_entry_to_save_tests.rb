class AddCmiEntryToSaveTests < ActiveRecord::Migration[7.0]
  def change
    add_column :save_tests, :cmi_entry, :string, default: 'ab-initio'
  end
end
