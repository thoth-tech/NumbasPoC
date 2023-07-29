class Test < ActiveRecord::Base
    validates :name, :attempt_number, :pass_status, :suspend_data, presence: true
  end
  