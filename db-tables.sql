-- sql to create tables

CREATE TABLE Campaigns (
  ID SERIAL PRIMARY KEY,
  ChainTxID varchar(255),
  ChainIsPending BOOLEAN,
  ChainConfirmedID INTEGER UNIQUE,
  Title varchar(255),
  Description varchar(255),
  URL varchar(255),
  Image varchar(255),
  BlockHeightExpiration INTEGER,
  FundingGoal BIGINT NOT NULL,
  TotalRaised BIGINT NOT NULL DEFAULT 0,
  IsCollected BOOLEAN,
  DateCreated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  DateUpdated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
)

CREATE TABLE Contributions (
  CampaignID INTEGER NOT NULL,
  Principal VARCHAR(255) NOT NULL,
  Amount INTEGER,
  DateCreated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  DateUpdated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  IsRefunded BOOLEAN,
  PRIMARY KEY (CampaignID, Principal),
  FOREIGN KEY (CampaignID) REFERENCES Campaigns(ID)
)

-- TODO: add isCollected and isRefunded
