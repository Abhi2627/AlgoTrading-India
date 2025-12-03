import torch
import torch.nn as nn
import math

class TimeSeriesTransformer(nn.Module):
    """
    Aladdin v2.0 Brain: Transformer-based Time Series Predictor.
    Uses Multi-Head Attention to capture long-range dependencies.
    """
    def __init__(self, input_dim, d_model=64, nhead=4, num_layers=2, output_dim=1, dropout=0.1):
        super(TimeSeriesTransformer, self).__init__()
        
        self.model_type = 'Transformer'
        
        # 1. Embedding Layer: Projects features to high-dim space
        self.encoder = nn.Linear(input_dim, d_model)
        self.pos_encoder = PositionalEncoding(d_model, dropout)
        
        # 2. Transformer Encoder: The heavy lifter
        encoder_layers = nn.TransformerEncoderLayer(d_model, nhead, dim_feedforward=128, dropout=dropout, batch_first=True)
        self.transformer_encoder = nn.TransformerEncoder(encoder_layers, num_layers)
        
        # 3. Decoder: Projects back to price
        self.decoder = nn.Linear(d_model, output_dim)

    def forward(self, src):
        # src shape: [batch_size, seq_len, features]
        src = self.encoder(src)
        src = self.pos_encoder(src)
        
        # Transformer magic
        output = self.transformer_encoder(src)
        
        # Take the last time step's output for prediction
        output = output[:, -1, :]
        
        return self.decoder(output)

class PositionalEncoding(nn.Module):
    """
    Adds 'Time' context to the data since Transformers process everything in parallel.
    """
    def __init__(self, d_model, dropout=0.1, max_len=5000):
        super(PositionalEncoding, self).__init__()
        self.dropout = nn.Dropout(p=dropout)

        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2).float() * (-math.log(10000.0) / d_model))
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe)

    def forward(self, x):
        # x shape: [batch_size, seq_len, d_model]
        # Add positional encoding to input
        x = x + self.pe[:x.size(1), :].unsqueeze(0)
        return self.dropout(x)