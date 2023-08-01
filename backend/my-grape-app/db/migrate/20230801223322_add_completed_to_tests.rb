class AddCompletedToTests < ActiveRecord::Migration[7.0]
  def change
    add_column :save_tests, :completed, :boolean, default: false
    add_column :save_tests, :attempted_at, :datetime
  end
end