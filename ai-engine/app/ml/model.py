import torch
import torch.nn as nn

class AladdinPricePredictor(nn.Module):
    """
    The 'Decision Brain'.
    Uses LSTM (Long Short-Term Memory) to predict price movements.
    """
    def __init__(self, input_dim, hidden_dim=64, num_layers=2, output_dim=1):
        super(AladdinPricePredictor, self).__init__()
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        
        # LSTM Layer: The part that "remembers" history
        # batch_first=True means input shape is (batch, seq_len, features)
        self.lstm = nn.LSTM(
            input_dim, 
            hidden_dim, 
            num_layers, 
            batch_first=True, 
            dropout=0.2
        )
        
        # Linear Layer: The part that makes the final decision
        self.fc = nn.Linear(hidden_dim, output_dim)
        
    def forward(self, x):
        # Initialize hidden state with zeros
        h0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        c0 = torch.zeros(self.num_layers, x.size(0), self.hidden_dim).to(x.device)
        
        # Forward propagate LSTM
        # out shape: (batch_size, seq_length, hidden_dim)
        out, _ = self.lstm(x, (h0, c0))
        
        # We only care about the last time step (the most recent prediction)
        out = out[:, -1, :]
        
        # Convert to final price/signal
        out = self.fc(out)
        return out